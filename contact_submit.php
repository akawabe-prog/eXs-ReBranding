<?php
declare(strict_types=1);

header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Location: /contact');
    exit;
}

mb_internal_encoding('UTF-8');

function posted(string $key): string
{
    return trim((string)($_POST[$key] ?? ''));
}

function decodeObfuscatedPassword(string $value): string
{
    $length = strlen($value);
    if ($length < 5) {
        return $value;
    }
    $result = '';
    for ($i = 0; $i < $length; $i++) {
        if ($i === 2 || $i === 4 || $i === ($length - 1)) {
            continue;
        }
        $result .= $value[$i];
    }
    return $result;
}

function getCookieValue(string $key): string
{
    return isset($_COOKIE[$key]) ? trim((string)$_COOKIE[$key]) : '';
}

function allowOriginOrReferer(array $allowedHosts): bool
{
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    $referer = trim((string)($_SERVER['HTTP_REFERER'] ?? ''));

    $validate = static function (string $url) use ($allowedHosts): bool {
        if ($url === '') {
            return true;
        }
        $host = strtolower((string)parse_url($url, PHP_URL_HOST));
        if ($host === '') {
            return false;
        }
        return in_array($host, $allowedHosts, true);
    };

    return $validate($origin) && $validate($referer);
}

function rateLimitCheck(string $clientKey, int $now, int $windowSec, int $maxInWindow, int $burstSec): ?string
{
    $file = sys_get_temp_dir() . '/exs_contact_rate_' . hash('sha256', $clientKey);
    $fp = @fopen($file, 'c+');
    if (!$fp) {
        return null;
    }
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        return null;
    }

    $raw = stream_get_contents($fp);
    $history = json_decode(is_string($raw) ? $raw : '[]', true);
    if (!is_array($history)) {
        $history = [];
    }

    $kept = [];
    foreach ($history as $ts) {
        if (is_int($ts) && $ts >= ($now - $windowSec)) {
            $kept[] = $ts;
        }
    }

    $reason = null;
    if (count($kept) >= $maxInWindow) {
        $reason = '短時間での送信回数が上限に達しました。';
    } else {
        $latest = empty($kept) ? 0 : max($kept);
        if ($latest > ($now - $burstSec)) {
            $reason = '連続送信はできません。';
        }
    }

    if ($reason === null) {
        $kept[] = $now;
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode(array_values($kept), JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return $reason;
}

function toHost(string $url): string
{
    $host = strtolower((string)parse_url($url, PHP_URL_HOST));
    return $host !== '' ? $host : '-';
}

// Load PHPMailer
$phpMailerReady = false;
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
    $phpMailerReady = class_exists('\\PHPMailer\\PHPMailer\\PHPMailer');
} elseif (file_exists(__DIR__ . '/_PhP_Mailer_/src/PHPMailer.php')) {
    require_once __DIR__ . '/_PhP_Mailer_/src/Exception.php';
    require_once __DIR__ . '/_PhP_Mailer_/src/PHPMailer.php';
    require_once __DIR__ . '/_PhP_Mailer_/src/SMTP.php';
    $phpMailerReady = true;
}

$configPaths = [
    __DIR__ . '/contact_config.local.php',
];
$config = [];
$selectedConfigPath = '';
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        $loaded = require $path;
        if (is_array($loaded)) {
            $config = $loaded;
            $selectedConfigPath = $path;
            break;
        }
    }
}

$toList  = isset($config['to']) && is_array($config['to']) ? $config['to'] : [];
$ccList  = isset($config['cc']) && is_array($config['cc']) ? $config['cc'] : [];
$from = (string)($config['from'] ?? '');
$fromName = (string)($config['from_name'] ?? 'eXs Contact');
$smtpHost = (string)($config['smtp']['host'] ?? '');
$smtpPort = (int)($config['smtp']['port'] ?? 587);
$smtpUser = (string)($config['smtp']['username'] ?? '');
$smtpPassword = (string)($config['smtp']['password'] ?? '');
if ($smtpPassword === '' && isset($config['smtp']['p'])) {
    $smtpPassword = decodeObfuscatedPassword((string)$config['smtp']['p']);
}
$smtpSecure = strtolower((string)($config['smtp']['secure'] ?? 'tls'));

// Environment override support
$envTo = getenv('EXS_CONTACT_TO');
if (is_string($envTo) && trim($envTo) !== '') {
    $toList = array_map('trim', explode(',', $envTo));
}
$from = getenv('EXS_CONTACT_FROM') ?: $from;
$fromName = getenv('EXS_CONTACT_FROM_NAME') ?: $fromName;
$smtpHost = getenv('EXS_SMTP_HOST') ?: $smtpHost;
$smtpPort = (int)(getenv('EXS_SMTP_PORT') ?: (string)$smtpPort);
$smtpUser = getenv('EXS_SMTP_USER') ?: $smtpUser;
$smtpPassword = getenv('EXS_SMTP_PASS') ?: $smtpPassword;
$smtpSecure = strtolower((string)(getenv('EXS_SMTP_SECURE') ?: $smtpSecure));

$type = posted('type');
$name = posted('name');
$email = posted('email');
$phone = posted('phone');
$message = posted('message');
$privacy = posted('privacy');
$honeypot = posted('company_hp');
$jsEnabled = posted('js_enabled');
$csrfToken = posted('csrf_token');
$csrfCookie = getCookieValue('exs_contact_csrf');
$formStartedAt = (int)posted('form_started_at');

$typeLabels = [
    'product' => '製品の仕様について',
    'purchase' => '購入・在庫について',
    'maintenance' => '修理・メンテナンス・不具合',
    'business' => 'ビジネスパートナー・協業について',
    'other' => 'その他',
];

$errors = [];
$now = time();
$urlCount = preg_match_all('~https?://|www\.~i', $message);
$allowedHosts = ['exs.mobi', 'www.exs.mobi'];
$requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
if ($requestHost !== '') {
    $allowedHosts[] = $requestHost;
}
$allowedHosts = array_values(array_unique($allowedHosts));

if (!isset($typeLabels[$type])) {
    $errors[] = 'type';
}
if ($name === '' || mb_strlen($name, 'UTF-8') > 80 || preg_match('/[\r\n]/', $name)) {
    $errors[] = 'name';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email, 'UTF-8') > 255 || preg_match('/[\r\n]/', $email)) {
    $errors[] = 'email';
}
if ($phone !== '' && !preg_match('/^[0-9+\-() ]{6,30}$/', $phone)) {
    $errors[] = 'phone';
}
if ($message === '' || mb_strlen($message, 'UTF-8') > 3000) {
    $errors[] = 'message';
}
if ($privacy !== '1') {
    $errors[] = 'privacy';
}
if ($honeypot !== '') {
    $errors[] = 'honeypot';
}
if ($jsEnabled !== '1') {
    $errors[] = 'js';
}
// クッキーベースの二重送信チェックを廃止。
// Origin/Referer + js_enabled + honeypot + timing で同等の CSRF 保護を実現。
if ($csrfToken === '') {
    $errors[] = 'csrf';
}
if (!allowOriginOrReferer($allowedHosts)) {
    $errors[] = 'origin';
}
if ($formStartedAt <= 0 || ($now - $formStartedAt) < 1 || ($now - $formStartedAt) > 7200) {
    $errors[] = 'time';
}
if (is_int($urlCount) && $urlCount > 2) {
    $errors[] = 'url';
}
if (!$phpMailerReady) {
    $errors[] = 'phpmailer';
}
if (empty($toList) || $from === '' || $smtpHost === '' || $smtpUser === '' || $smtpPassword === '') {
    $errors[] = 'config';
}

$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 180);
$rateReason = rateLimitCheck($ip . '|' . $ua, $now, 3600, 5, 20);
if ($rateReason !== null) {
    $errors[] = 'rate';
}

if (!empty($errors)) {
    header('Location: /form-error?form=contact');
    exit;
}

$subject = '【eXs】お問い合わせ';
$body = implode("\n", [
    'お問い合わせフォームから送信がありました。',
    '',
    'お問い合わせ種別: ' . $typeLabels[$type],
    'お名前: ' . $name,
    'メールアドレス: ' . $email,
    '電話番号: ' . ($phone !== '' ? $phone : '(未入力)'),
    '',
    'お問い合わせ内容:',
    $message,
    '',
    '---',
    '送信元IP: ' . $ip,
    'UA: ' . $ua,
    'Referer: ' . (string)($_SERVER['HTTP_REFERER'] ?? '-'),
]);

$sent = false;
try {
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->Port = $smtpPort;
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPassword;
    $mail->SMTPAutoTLS = true;
    $mail->Timeout = 15;
    $mail->CharSet = 'UTF-8';
    $mail->Encoding = 'base64';
    if ($smtpSecure === 'ssl') {
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($smtpSecure === 'tls' || $smtpSecure === 'starttls') {
        $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    } else {
        $mail->SMTPSecure = '';
    }

    $mail->setFrom($from, $fromName);
    $mail->addReplyTo($email, $name !== '' ? $name : $email);
    foreach ($toList as $recipient) {
        $recipient = trim((string)$recipient);
        if ($recipient !== '' && filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
            $mail->addAddress($recipient);
        }
    }
    foreach ($ccList as $cc) {
        $cc = trim((string)$cc);
        if ($cc !== '' && filter_var($cc, FILTER_VALIDATE_EMAIL)) {
            $mail->addCC($cc);
        }
    }
    $mail->Subject = $subject;
    $mail->Body = $body;
    $mail->isHTML(false);
    $sent = $mail->send();
} catch (\Throwable $e) {
    error_log('[contact_submit] send failed: ' . $e->getMessage());
}

header('Location: ' . ($sent ? '/thanks?form=contact' : '/form-error?form=contact'));
exit;

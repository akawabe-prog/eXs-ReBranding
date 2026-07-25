<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=UTF-8');
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Location: /contact_test.html');
    exit;
}

mb_internal_encoding('UTF-8');

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

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
    $file = sys_get_temp_dir() . '/exs_contact_test_rate_' . hash('sha256', $clientKey);
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
        $reason = '短時間での送信回数が上限に達しました。時間を置いて再度お試しください。';
    } else {
        $latest = empty($kept) ? 0 : max($kept);
        if ($latest > ($now - $burstSec)) {
            $reason = '連続送信はできません。少し待ってから再度お試しください。';
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

$configPath = __DIR__ . '/contact_test_config.local.php';
$config = file_exists($configPath) ? require $configPath : [];

$toList = isset($config['to']) && is_array($config['to']) ? $config['to'] : [];
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

// Environment override support (recommended on Sakura)
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
$honeypot = posted('company');
$jsEnabled = posted('js_enabled');
$csrfToken = posted('csrf_token');
$csrfCookie = getCookieValue('exs_ct_csrf');
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
    $errors[] = 'お問い合わせ種別を選択してください。';
}
if ($name === '' || mb_strlen($name, 'UTF-8') > 80) {
    $errors[] = 'お名前は1〜80文字で入力してください。';
}
if (preg_match('/[\r\n]/', $name)) {
    $errors[] = 'お名前に不正な文字が含まれています。';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email, 'UTF-8') > 255) {
    $errors[] = '有効なメールアドレスを入力してください。';
}
if (preg_match('/[\r\n]/', $email)) {
    $errors[] = 'メールアドレスに不正な文字が含まれています。';
}
if ($phone !== '' && (!preg_match('/^[0-9+\-() ]{6,30}$/', $phone))) {
    $errors[] = '電話番号の形式が正しくありません。';
}
if ($message === '') {
    $errors[] = 'お問い合わせ内容を入力してください。';
}
if (mb_strlen($message, 'UTF-8') > 3000) {
    $errors[] = 'お問い合わせ内容は3000文字以内で入力してください。';
}
if ($privacy !== '1') {
    $errors[] = 'プライバシーポリシーへの同意が必要です。';
}
if ($honeypot !== '') {
    $errors[] = 'スパム判定により送信できませんでした。';
}
if ($jsEnabled !== '1') {
    $errors[] = 'ブラウザ設定を確認のうえ再度お試しください。';
}
if ($csrfToken === '' || $csrfCookie === '' || !hash_equals($csrfCookie, $csrfToken)) {
    $errors[] = 'セキュリティチェックに失敗しました。ページを再読み込みして再度お試しください。';
}
if (!allowOriginOrReferer($allowedHosts)) {
    $errors[] = '送信元の検証に失敗しました。';
}
if ($formStartedAt <= 0 || ($now - $formStartedAt) < 3 || ($now - $formStartedAt) > 7200) {
    $errors[] = 'フォームの有効時間外です。ページを再読み込みして再度お試しください。';
}
if (is_int($urlCount) && $urlCount > 2) {
    $errors[] = 'URLを含む送信は制限されています。';
}

if (!$phpMailerReady) {
    $errors[] = 'メール送信ライブラリが見つかりません。';
}
if (empty($toList) || $from === '' || $smtpHost === '' || $smtpUser === '' || $smtpPassword === '') {
    $errors[] = 'メール送信設定が不足しています。';
}

$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 180);
$rateReason = rateLimitCheck($ip . '|' . $ua, $now, 3600, 5, 20);
if ($rateReason !== null) {
    $errors[] = $rateReason;
}

$sent = false;
if (empty($errors)) {
    $subject = '【eXs】お問い合わせフォーム送信（テスト）';
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
        'IP: ' . $ip,
        'UA: ' . $ua,
        'Referer: ' . (string)($_SERVER['HTTP_REFERER'] ?? '-'),
    ]);

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
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->isHTML(false);

        $sent = $mail->send();
    } catch (\Throwable $e) {
        error_log('[contact_test_submit] send failed: ' . $e->getMessage());
        $errors[] = 'メール送信に失敗しました。時間を置いて再度お試しください。';
    }
}
?>
<!DOCTYPE html>
<html lang="ja" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="/">
    <title>Contact Result | eXs</title>
    <meta name="robots" content="noindex,nofollow">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Noto Sans JP"', 'sans-serif'],
                        en: ['"Montserrat"', 'sans-serif'],
                    },
                    colors: {
                        brand: { black: '#111111', gray: '#F5F5F5' }
                    },
                    letterSpacing: { widest: '.15em' }
                }
            }
        };
    </script>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body class="font-sans text-brand-black antialiased bg-white flex flex-col min-h-screen">
    <header id="common-header" class="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-sm text-brand-black shadow-sm transition-all duration-300"></header>

    <main class="flex-grow pt-40 pb-20 px-6">
        <div class="container mx-auto max-w-2xl">
            <div class="text-center mb-12">
                <h1 class="font-en text-4xl md:text-5xl font-bold tracking-tighter mb-4">CONTACT</h1>
                <p class="text-xs text-gray-400 tracking-widest">送信結果</p>
            </div>

            <?php if (!$sent || !empty($errors)) { ?>
            <div class="border border-red-200 bg-red-50 p-6 md:p-8 mb-8">
                <p class="font-bold text-red-700 mb-3">送信できませんでした</p>
                <ul class="text-sm text-red-700 list-disc pl-6 space-y-1">
                    <?php foreach ($errors as $error) { ?>
                    <li><?php echo h($error); ?></li>
                    <?php } ?>
                </ul>
            </div>
            <?php } else { ?>
            <div class="border border-green-200 bg-green-50 p-6 md:p-8 mb-8">
                <p class="font-bold text-green-700">お問い合わせを受け付けました。</p>
                <p class="text-sm text-green-700 mt-2">通常、3営業日以内に担当者より返信いたします。</p>
            </div>
            <?php } ?>

            <div class="flex flex-col md:flex-row gap-3">
                <a href="/contact_test.html" class="inline-block text-center bg-brand-black text-white px-8 py-4 text-sm font-en tracking-widest hover:opacity-90 transition">
                    フォームに戻る
                </a>
                <a href="/" class="inline-block text-center border border-gray-300 px-8 py-4 text-sm font-en tracking-widest hover:border-black transition">
                    TOPへ戻る
                </a>
            </div>
        </div>
    </main>

    <footer id="common-footer" class="bg-brand-black text-white pt-20 pb-10 px-6 mt-auto"></footer>
    <script src="/assets/js/components.js"></script>
    <script src="/assets/js/script.js"></script>
</body>
</html>

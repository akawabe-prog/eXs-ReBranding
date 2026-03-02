<?php
declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: contact.html');
    exit;
}

mb_internal_encoding('UTF-8');

function posted(string $key): string
{
    return trim((string)($_POST[$key] ?? ''));
}

$type = posted('type');
$name = posted('name');
$email = posted('email');
$phone = posted('phone');
$message = posted('message');
$privacy = (string)($_POST['privacy'] ?? '');

$errors = [];
if ($type === '') {
    $errors[] = 'type';
}
if ($name === '') {
    $errors[] = 'name';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'email';
}
if ($message === '') {
    $errors[] = 'message';
}
if ($privacy !== '1') {
    $errors[] = 'privacy';
}

if (!empty($errors)) {
    header('Location: form-error.html?form=contact');
    exit;
}

$to = 'info@customjapan.jp';
$subject = '【eXs】お問い合わせ';
$body = implode("\n", [
    "お問い合わせ種別: {$type}",
    "お名前: {$name}",
    "メールアドレス: {$email}",
    "電話番号: " . ($phone !== '' ? $phone : '-'),
    '',
    'お問い合わせ内容',
    $message,
    '',
    '---',
    '送信元IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '-'),
    'UA: ' . ($_SERVER['HTTP_USER_AGENT'] ?? '-'),
]);

$headers = [
    'From: noreply@exs.customjapan.net',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
];

$sent = false;
if (function_exists('mb_send_mail')) {
    $sent = mb_send_mail($to, $subject, $body, implode("\r\n", $headers));
} else {
    $sent = mail($to, $subject, $body, implode("\r\n", $headers));
}

header('Location: ' . ($sent ? 'thanks.html?form=contact' : 'form-error.html?form=contact'));
exit;

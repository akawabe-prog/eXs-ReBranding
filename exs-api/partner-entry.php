<?php
declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: partner-entry.html');
    exit;
}

mb_internal_encoding('UTF-8');

function posted(string $key): string
{
    return trim((string)($_POST[$key] ?? ''));
}

$company = posted('company');
$name = posted('name');
$email = posted('email');
$tel = posted('tel');
$prefecture = posted('prefecture');
$category = posted('category');
$volume = posted('volume');
$url = posted('url');
$message = posted('message');
$privacy = (string)($_POST['privacy'] ?? '');
$models = $_POST['model'] ?? [];

if (!is_array($models)) {
    $models = [];
}
$models = array_values(array_filter(array_map(static fn($v): string => trim((string)$v), $models)));

$errors = [];
if ($company === '') {
    $errors[] = 'company';
}
if ($name === '') {
    $errors[] = 'name';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'email';
}
if ($tel === '') {
    $errors[] = 'tel';
}
if ($prefecture === '') {
    $errors[] = 'prefecture';
}
if ($category === '') {
    $errors[] = 'category';
}
if (count($models) === 0) {
    $errors[] = 'model';
}
if ($privacy !== '1') {
    $errors[] = 'privacy';
}

if (!empty($errors)) {
    header('Location: form-error.html?form=partner');
    exit;
}

$to = 'info@customjapan.jp';
$subject = '【eXs】パートナー登録申請';
$body = implode("\n", [
    'eXs パートナー登録申請',
    '',
    "会社・店舗名: {$company}",
    "担当者名: {$name}",
    "メールアドレス: {$email}",
    "電話番号: {$tel}",
    "都道府県: {$prefecture}",
    "業態: {$category}",
    '取扱希望モデル: ' . implode(', ', $models),
    '想定販売台数: ' . ($volume !== '' ? $volume : '未定'),
    'WEB/SNS: ' . ($url !== '' ? $url : '-'),
    '',
    'ご質問・補足',
    ($message !== '' ? $message : '-'),
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

header('Location: ' . ($sent ? 'thanks.html?form=partner' : 'form-error.html?form=partner'));
exit;

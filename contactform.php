<?php
ini_set('log_errors', '0');
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array(
        'ok' => false,
        'message' => 'Please submit the form from the page.',
    ));
    exit;
}

require_once __DIR__ . '/class.phpmailer.php';

$mailTo = 'info@mentorus.ae, reshmasateesh.penta@gmail.com';
$mailFrom = 'info@mentorus.ae';

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$title = trim($_POST['title'] ?? '');
$experience = trim($_POST['experience'] ?? '');

function field($value, $limit)
{
    $value = str_replace(array("\r", "\n"), ' ', strip_tags($value));
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $limit);
    }
    return substr($value, 0, $limit);
}

function send_plain_mail($mailTo, $subject, $body, $fromEmail, $replyEmail, $replyName)
{
    $recipients = array();
    foreach (preg_split('/\s*,\s*/', $mailTo) as $address) {
        if ($address !== '' && filter_var($address, FILTER_VALIDATE_EMAIL)) {
            $recipients[] = $address;
        }
    }
    if (!$recipients || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $replyName = trim(str_replace(array("\r", "\n", '<', '>'), '', $replyName));
    $headers = array(
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: Mentorus CHRM <' . $fromEmail . '>',
        'Reply-To: ' . ($replyName !== '' ? $replyName . ' ' : '') . '<' . $replyEmail . '>',
    );

    ini_set('sendmail_from', $fromEmail);
    try {
        return mail(implode(', ', $recipients), $subject, $body, implode("\r\n", $headers));
    } catch (Exception $exception) {
        return false;
    } catch (Error $error) {
        return false;
    }
}

$name = field($name, 80);
$email = field($email, 120);
$phone = field($phone, 30);
$title = field($title, 80);
$experience = field($experience, 40);
$digits = preg_replace('/\D+/', '', $phone);

if ($name === '' || !preg_match('/\p{L}/u', $name)) {
    http_response_code(422);
    echo json_encode(array('ok' => false, 'message' => 'Please enter a valid full name.'));
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(array('ok' => false, 'message' => 'Please enter a valid work email.'));
    exit;
}

if (strlen($digits) < 8 || strlen($digits) > 15) {
    http_response_code(422);
    echo json_encode(array('ok' => false, 'message' => 'Please enter a valid phone number.'));
    exit;
}

$blank = '—';
$body = "CHRM seat request\n\n"
    . 'Name: ' . ($name !== '' ? $name : $blank) . "\n"
    . 'Email: ' . ($email !== '' ? $email : $blank) . "\n"
    . 'Phone: ' . ($phone !== '' ? $phone : $blank) . "\n"
    . 'Job title: ' . ($title !== '' ? $title : $blank) . "\n"
    . 'Experience: ' . ($experience !== '' ? $experience : $blank) . "\n";

$mail = new PHPMailer();
$mail->isMail();
$mail->CharSet = 'UTF-8';
$mail->isHTML(false);
$mail->ContentType = 'text/plain';
$mail->setFrom($mailFrom, 'Mentorus CHRM');
$mail->addReplyTo($email, $name);
foreach (preg_split('/\s*,\s*/', $mailTo) as $address) {
    if ($address !== '') {
        $mail->addAddress($address);
    }
}
$mail->Subject = 'CHRM seat request from ' . $name;
$mail->Body = $body;
$mail->Sender = $mailFrom;

$sent = false;
try {
    $sent = $mail->send();
} catch (Exception $exception) {
    $sent = false;
} catch (Error $error) {
    $sent = false;
}

if (!$sent) {
    $sent = send_plain_mail($mailTo, $mail->Subject, $body, $mailFrom, $email, $name);
}

if (!$sent) {
    http_response_code(500);
    echo json_encode(array(
        'ok' => false,
        'message' => 'We could not send your request. Please WhatsApp or call us instead.',
    ));
    exit;
}

echo json_encode(array(
    'ok' => true,
    'message' => 'Thank you. Your request is in, and our admissions advisor will call you back.',
));

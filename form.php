<?php
// form.php - Submission handler

header('Content-Type: text/plain; charset=utf-8');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Sanitize inputs
    $name = isset($_POST['name']) ? htmlspecialchars(strip_tags(trim($_POST['name']))) : 'Не указано';
    $phone = isset($_POST['phone']) ? htmlspecialchars(strip_tags(trim($_POST['phone']))) : 'Не указано';
    $address = isset($_POST['address']) ? htmlspecialchars(strip_tags(trim($_POST['address']))) : 'Не указано';
    $problem = isset($_POST['problem']) ? htmlspecialchars(strip_tags(trim($_POST['problem']))) : '';
    $calc_result = isset($_POST['calc_result']) ? htmlspecialchars(strip_tags(trim($_POST['calc_result']))) : '';
    
    $message = "🚨 НОВАЯ ЗАЯВКА - Электрик Кишинев\n\n";
    $message .= "👤 Имя: $name\n";
    $message .= "📞 Телефон: $phone\n";
    $message .= "🏠 Адрес: $address\n";
    if ($problem) $message .= "❓ Проблема: $problem\n";
    if ($calc_result) $message .= "🧮 Калькулятор: $calc_result\n";

    // Handle Photo Upload
    $photoPath = "";
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] == UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $filename = time() . '_' . basename($_FILES['photo']['name']);
        $targetPath = $uploadDir . sanitizeFile($filename);
        
        if (move_uploaded_file($_FILES['photo']['tmp_name'], $targetPath)) {
            $photoPath = $targetPath;
            $message .= "📸 Фото прикреплено (сохранено на сервере: $photoPath)\n";
        }
    }
    
    // Save to text file as fallback
    $logEntry = "[" . date("Y-m-d H:i:s") . "]\n" . $message . "-----------------------\n";
    file_put_contents('leads.txt', $logEntry, FILE_APPEND);

    // --- TELEGRAM NOTIFICATION (Optional Setup) ---
    // define('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN');
    // define('TELEGRAM_CHAT_ID', 'YOUR_CHAT_ID');
    // 
    // if (defined('TELEGRAM_BOT_TOKEN') && defined('TELEGRAM_CHAT_ID')) {
    //     $url = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/sendMessage?chat_id=" . TELEGRAM_CHAT_ID;
    //     $url .= "&text=" . urlencode($message);
    //     $ch = curl_init();
    //     $optArray = array(CURLOPT_URL => $url, CURLOPT_RETURNTRANSFER => true);
    //     curl_setopt_array($ch, $optArray);
    //     $result = curl_exec($ch);
    //     curl_close($ch);
    // }

    // --- EMAIL NOTIFICATION (Optional Setup) ---
    // $to = "your-email@example.com";
    // $subject = "Новая заявка - Электрик";
    // $headers = "From: noreply@yoursite.com\r\nReply-To: $phone\r\n";
    // mail($to, $subject, $message, $headers);

    echo "OK";
} else {
    http_response_code(405);
    echo "Method Not Allowed";
}

function sanitizeFile($filename) {
    return preg_replace('/[^a-zA-Z0-9-_\.]/', '', $filename);
}
?>

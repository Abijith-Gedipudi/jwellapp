<?php
// jwt.php
$jwt_secret = 'manepally-super-secret-key-2025';

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

function jwt_encode($payload) {
    global $jwt_secret;
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    // Set expiration to 12 hours
    $payload['exp'] = time() + (12 * 60 * 60);
    
    $base64_url_header = base64url_encode($header);
    $base64_url_payload = base64url_encode(json_encode($payload));
    
    $signature = hash_hmac('sha256', $base64_url_header . "." . $base64_url_payload, $jwt_secret, true);
    $base64_url_signature = base64url_encode($signature);
    
    return $base64_url_header . "." . $base64_url_payload . "." . $base64_url_signature;
}

function jwt_decode($jwt) {
    global $jwt_secret;
    $parts = explode('.', $jwt);
    if(count($parts) !== 3) return false;
    
    $signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], $jwt_secret, true);
    $base64_url_signature = base64url_encode($signature);
    
    if(hash_equals($base64_url_signature, $parts[2])) {
        $payload = json_decode(base64url_decode($parts[1]), true);
        if(isset($payload['exp']) && $payload['exp'] < time()) return false;
        return $payload;
    }
    return false;
}

function get_bearer_token() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function require_auth() {
    $token = get_bearer_token();
    if(!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        exit;
    }
    $decoded = jwt_decode($token);
    if(!$decoded) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }
    return $decoded;
}

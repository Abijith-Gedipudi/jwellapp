<?php
// api.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config.php';
require_once 'jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';
$body = json_decode(file_get_contents('php://input'), true);

function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function sendError($msg, $status = 500) {
    sendJson(['error' => $msg], $status);
}

try {
    // ----------------------------------------------------
    // AUTH ROUTES
    // ----------------------------------------------------
    if (preg_match('#^auth/admin/login$#', $route)) {
        if ($method === 'POST') {
            $password = $body['password'] ?? '';
            $stmt = $pdo->query("SELECT setting_value FROM admin_settings WHERE setting_key = 'adminPass'");
            $row = $stmt->fetch();
            if (!$row) sendError('Admin config not found');
            
            if ($password === $row['setting_value']) {
                $token = jwt_encode(['role' => 'admin', 'id' => 'admin']);
                sendJson(['token' => $token, 'user' => ['role' => 'admin', 'name' => 'Admin', 'id' => 'admin']]);
            } else {
                sendError('Invalid admin password', 401);
            }
        }
    }
    
    if (preg_match('#^auth/cre/login$#', $route)) {
        if ($method === 'POST') {
            $storeId = $body['storeId'] ?? '';
            $pin = $body['pin'] ?? '';
            
            $stmt = $pdo->prepare("SELECT id, name, pin, is_active FROM stores WHERE id = ?");
            $stmt->execute([$storeId]);
            $store = $stmt->fetch();
            
            if (!$store) sendError('Store not found', 404);
            if (!$store['is_active']) sendError('Store is disabled', 403);
            
            if ($pin === $store['pin']) {
                $token = jwt_encode(['role' => 'cre', 'storeId' => $store['id']]);
                sendJson([
                    'token' => $token, 
                    'user' => ['role' => 'cre', 'name' => 'CRE', 'id' => 'cre_' . $store['id'], 'storeId' => $store['id'], 'storeName' => $store['name']]
                ]);
            } else {
                sendError('Invalid PIN', 401);
            }
        }
    }
    
    if (preg_match('#^auth/admin/password$#', $route)) {
        if ($method === 'POST') {
            require_admin();
            $oldPassword = $body['oldPassword'] ?? '';
            $newPassword = $body['newPassword'] ?? '';
            
            $stmt = $pdo->query("SELECT setting_value FROM admin_settings WHERE setting_key = 'adminPass'");
            $adminPass = $stmt->fetchColumn();
            
            if ($oldPassword !== $adminPass) sendError('Current password incorrect', 401);
            
            $stmt = $pdo->prepare("UPDATE admin_settings SET setting_value = ? WHERE setting_key = 'adminPass'");
            $stmt->execute([$newPassword]);
            sendJson(['success' => true, 'message' => 'Password updated successfully']);
        }
    }

    // ----------------------------------------------------
    // STORES ROUTES
    // ----------------------------------------------------
    if (preg_match('#^stores$#', $route)) {
        if ($method === 'GET') {
            $authUser = optional_auth();
            $isAdmin = ($authUser['role'] ?? '') === 'admin';
            $fields = $isAdmin ? 'id, name, pin, is_active' : 'id, name, is_active';
            $stmt = $pdo->query("SELECT $fields FROM stores");
            $stores = $stmt->fetchAll();
            // Boolean conversion for JSON (PDO returns strings for tinyint)
            foreach($stores as &$s) {
                $s['is_active'] = (bool)$s['is_active'];
                $s['active'] = $s['is_active'];
            }
            sendJson($stores);
        }

        if ($method === 'POST') {
            require_admin();
            $name = trim($body['name'] ?? '');
            $pin = trim($body['pin'] ?? '');

            if ($name === '' || $pin === '') {
                sendError('Store name and PIN are required', 400);
            }

            $id = 's' . time();
            $stmt = $pdo->prepare("INSERT INTO stores (id, name, pin, is_active) VALUES (?, ?, ?, ?)");
            $stmt->execute([$id, $name, $pin, 1]);
            sendJson(['success' => true, 'id' => $id]);
        }
    }
    
    if (preg_match('#^stores/([^/]+)/toggle$#', $route, $matches)) {
        if ($method === 'PUT' || $method === 'POST') {
            require_admin();
            $id = $matches[1];
            $stmt = $pdo->prepare("UPDATE stores SET is_active = NOT is_active WHERE id = ?");
            $stmt->execute([$id]);
            sendJson(['success' => true]);
        }
    }
    
    if (preg_match('#^stores/([^/]+)$#', $route, $matches)) {
        if ($method === 'PUT') {
            require_admin();
            $id = $matches[1];
            $pin = $body['pin'] ?? '';
            $stmt = $pdo->prepare("UPDATE stores SET pin = ? WHERE id = ?");
            $stmt->execute([$pin, $id]);
            sendJson(['success' => true]);
        }
    }

    // ----------------------------------------------------
    // COUNTERS ROUTES
    // ----------------------------------------------------
    if (preg_match('#^counters$#', $route)) {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT id, store_id, name, category, products, is_active FROM counters");
            $counters = $stmt->fetchAll();
            $countersMap = [];
            foreach($counters as $c) {
                $storeId = $c['store_id'];
                if (!isset($countersMap[$storeId])) {
                    $countersMap[$storeId] = [];
                }
                $c['is_active'] = (bool)$c['is_active'];
                $c['active'] = $c['is_active'];
                $countersMap[$storeId][] = $c;
            }
            sendJson($countersMap);
        }
    }
    
    if (preg_match('#^counters/([^/]+)$#', $route, $matches)) {
        $storeId = $matches[1];
        if ($method === 'POST') {
            require_admin();
            $id = 'c' . time();
            $name = $body['name'] ?? '';
            $category = $body['category'] ?? '';
            $products = $body['products'] ?? '';
            
            $stmt = $pdo->prepare("INSERT INTO counters (id, store_id, name, category, products, is_active) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $storeId, $name, $category, $products, 1]);
            sendJson(['success' => true, 'id' => $id]);
        }
    }
    
    if (preg_match('#^counters/([^/]+)/toggle$#', $route, $matches)) {
        if ($method === 'PUT') {
            require_admin();
            $id = $matches[1];
            $stmt = $pdo->prepare("UPDATE counters SET is_active = NOT is_active WHERE id = ?");
            $stmt->execute([$id]);
            sendJson(['success' => true]);
        }
    }
    
    if (preg_match('#^counters/([^/]+)$#', $route, $matches)) { // DELETE
        if ($method === 'DELETE') {
            require_admin();
            $id = $matches[1];
            $stmt = $pdo->prepare("DELETE FROM counters WHERE id = ?");
            $stmt->execute([$id]);
            sendJson(['success' => true]);
        }
    }

    // ----------------------------------------------------
    // VISITS ROUTES
    // ----------------------------------------------------
    if (preg_match('#^visits$#', $route)) {
        if ($method === 'GET') {
            $sql = "SELECT v.*, s.name as storeName, c.name as counterName, c.category as counterCat 
                    FROM visits v 
                    JOIN stores s ON v.store_id = s.id 
                    LEFT JOIN counters c ON v.counter_id = c.id
                    ORDER BY v.entry_time DESC";
            $stmt = $pdo->query($sql);
            $rows = $stmt->fetchAll();
            
            $entries = [];
            foreach($rows as $r) {
                $entries[] = [
                    'id' => $r['id'],
                    'storeId' => $r['store_id'],
                    'storeName' => $r['storeName'],
                    'creName' => $r['cre_name'],
                    'custName' => $r['customer_name'],
                    'phone' => $r['customer_phone'],
                    'custType' => $r['customer_phone'] ? 'Repeat' : 'New',
                    'purpose' => $r['purpose'],
                    'category' => $r['category'],
                    'counterId' => $r['counter_id'],
                    'counterName' => $r['counterName'],
                    'counterCat' => $r['counterCat'],
                    'outcome' => $r['outcome'],
                    'timestamp' => strtotime($r['entry_time']) * 1000,
                    'exitTimestamp' => $r['exit_time'] ? strtotime($r['exit_time']) * 1000 : null,
                    'billNo' => $r['bill_number'],
                    'reason' => $r['loss_reason'],
                    'remarks' => $r['remarks']
                ];
            }
            sendJson($entries);
        }
        
        if ($method === 'POST') {
            $storeId = $body['storeId'] ?? '';
            $creName = $body['creName'] ?? '';
            $custName = $body['custName'] ?? null;
            $phone = $body['phone'] ?? null;
            $purpose = $body['purpose'] ?? '';
            $category = $body['category'] ?? '';
            $counterId = $body['counterId'] ?? '';
            $remarks = $body['remarks'] ?? null;
            
            $stmt = $pdo->prepare("INSERT INTO visits (store_id, cre_name, customer_name, customer_phone, purpose, category, counter_id, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$storeId, $creName, $custName, $phone, $purpose, $category, $counterId, $remarks]);
            
            sendJson(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
    }
    
    if (preg_match('#^visits/([^/]+)$#', $route, $matches)) {
        $id = $matches[1];
        if ($method === 'PUT') {
            $outcome = $body['outcome'] ?? '';
            $reason = $body['reason'] ?? null;
            $billNo = $body['billNo'] ?? null;
            
            $stmt = $pdo->prepare("UPDATE visits SET outcome = ?, exit_time = CURRENT_TIMESTAMP, loss_reason = ?, bill_number = ? WHERE id = ?");
            $stmt->execute([$outcome, $reason, $billNo, $id]);
            sendJson(['success' => true]);
        }
        
        if ($method === 'DELETE') {
            require_auth();
            $stmt = $pdo->prepare("DELETE FROM visits WHERE id = ?");
            $stmt->execute([$id]);
            sendJson(['success' => true]);
        }
    }

    // Default 404
    sendError('Route not found', 404);

} catch (Exception $e) {
    sendError($e->getMessage());
}

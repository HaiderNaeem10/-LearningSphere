<?php
// Backend authentication and authorization middleware
// Usage: include_once '../../middleware/AuthMiddleware.php';
// Then call AuthMiddleware::requireAuth($requiredRoles);
// $requiredRoles can be a string or array of allowed roles (e.g., ['student','instructor'])

require_once __DIR__ . '/JwtHandler.php';

class AuthMiddleware {
    /**
     * Verify JWT from Authorization header and optionally enforce role.
     * @param string|array|null $requiredRoles Allowed role(s). Null = any authenticated user.
     * @return array Decoded token payload.
     */
    public static function requireAuth($requiredRoles = null) {
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            http_response_code(401);
            echo json_encode(["message" => "Missing Authorization header"]);
            exit;
        }
        $authHeader = $headers['Authorization'];
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(["message" => "Invalid Authorization header format"]);
            exit;
        }
        $token = $matches[1];
        $jwt = new JwtHandler();
        $payload = $jwt->decode($token);
        if (!$payload) {
            http_response_code(401);
            echo json_encode(["message" => "Invalid or expired token"]);
            exit;
        }
        // Role check if required
        if ($requiredRoles !== null) {
            $userRole = $payload['role'] ?? null;
            $allowed = is_array($requiredRoles) ? $requiredRoles : [$requiredRoles];
            if (!in_array($userRole, $allowed)) {
                http_response_code(403);
                echo json_encode(["message" => "Forbidden: insufficient role"]);
                exit;
            }
        }
        // Expose payload for downstream code
        return $payload;
    }
}
?>
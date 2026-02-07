# Backend PHP + MySQL para Sistema Admin de Senhas

Este arquivo contém todo o código do backend PHP e o script SQL para rodar no XAMPP.

## Estrutura de Pastas no XAMPP

Crie a seguinte estrutura em `C:\xampp\htdocs\admin-senhas\`:

```
admin-senhas/
├── api/
│   ├── config/
│   │   └── database.php
│   ├── models/
│   │   ├── Admin.php
│   │   ├── Loja.php
│   │   ├── Sistema.php
│   │   ├── Funcionario.php
│   │   └── Acesso.php
│   ├── auth/
│   │   ├── login.php
│   │   ├── logout.php
│   │   └── check-session.php
│   ├── lojas/
│   │   └── index.php
│   ├── sistemas/
│   │   └── index.php
│   ├── funcionarios/
│   │   └── index.php
│   ├── acessos/
│   │   └── index.php
│   └── .htaccess
└── database.sql
```

---

## 1. Script SQL (database.sql)

```sql
-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS admin_senhas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE admin_senhas;

-- Tabela de administradores
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de lojas
CREATE TABLE lojas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    endereco VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sistemas
CREATE TABLE sistemas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    url VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de funcionários
CREATE TABLE funcionarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    tipo ENUM('loja', 'central_vendas') NOT NULL,
    loja_id INT,
    setor ENUM('cartao', 'consignado', 'energia', 'fgts'),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loja_id) REFERENCES lojas(id) ON DELETE SET NULL
);

-- Tabela de acessos (logins/senhas dos funcionários)
CREATE TABLE acessos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    funcionario_id INT NOT NULL,
    sistema_id INT NOT NULL,
    usuario VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE,
    FOREIGN KEY (sistema_id) REFERENCES sistemas(id) ON DELETE CASCADE
);

-- Inserir admin padrão (senha: admin123)
INSERT INTO admins (username, password, nome) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador');

-- Dados de exemplo
INSERT INTO lojas (nome, endereco) VALUES 
('Loja Centro', 'Rua Principal, 123'),
('Loja Shopping', 'Av. das Américas, 456'),
('Loja Bairro', 'Rua das Flores, 789');

INSERT INTO sistemas (nome, descricao, url) VALUES 
('E-mail Corporativo', 'Sistema de e-mail da empresa', 'https://mail.empresa.com'),
('ERP Sistema', 'Sistema de gestão integrada', 'https://erp.empresa.com'),
('CRM Vendas', 'Sistema de CRM para vendas', 'https://crm.empresa.com'),
('Portal RH', 'Portal de recursos humanos', 'https://rh.empresa.com');
```

---

## 2. Configuração do Banco (api/config/database.php)

```php
<?php
class Database {
    private $host = "localhost";
    private $db_name = "admin_senhas";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
            exit;
        }
        return $this->conn;
    }
}
?>
```

---

## 3. Models

### api/models/Admin.php
```php
<?php
class Admin {
    private $conn;
    private $table = "admins";

    public $id;
    public $username;
    public $password;
    public $nome;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login($username, $password) {
        $query = "SELECT id, username, password, nome FROM " . $this->table . " WHERE username = :username";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $username);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($password, $row['password'])) {
                return $row;
            }
        }
        return false;
    }
}
?>
```

### api/models/Loja.php
```php
<?php
class Loja {
    private $conn;
    private $table = "lojas";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT * FROM " . $this->table . " ORDER BY nome";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table . " (nome, endereco, ativo) VALUES (:nome, :endereco, :ativo)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":nome", $data['nome']);
        $stmt->bindParam(":endereco", $data['endereco']);
        $stmt->bindParam(":ativo", $data['ativo'], PDO::PARAM_BOOL);
        
        if ($stmt->execute()) {
            return $this->getById($this->conn->lastInsertId());
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $params = [":id" => $id];

        foreach (['nome', 'endereco', 'ativo'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $query = "UPDATE " . $this->table . " SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($params)) {
            return $this->getById($id);
        }
        return false;
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }
}
?>
```

### api/models/Sistema.php
```php
<?php
class Sistema {
    private $conn;
    private $table = "sistemas";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll($incluirInativos = false) {
        $query = "SELECT * FROM " . $this->table;
        if (!$incluirInativos) {
            $query .= " WHERE ativo = 1";
        }
        $query .= " ORDER BY nome";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table . " (nome, descricao, url, ativo) VALUES (:nome, :descricao, :url, :ativo)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":nome", $data['nome']);
        $stmt->bindParam(":descricao", $data['descricao']);
        $stmt->bindParam(":url", $data['url']);
        $stmt->bindParam(":ativo", $data['ativo'], PDO::PARAM_BOOL);
        
        if ($stmt->execute()) {
            return $this->getById($this->conn->lastInsertId());
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $params = [":id" => $id];

        foreach (['nome', 'descricao', 'url', 'ativo'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $query = "UPDATE " . $this->table . " SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($params)) {
            return $this->getById($id);
        }
        return false;
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }
}
?>
```

### api/models/Funcionario.php
```php
<?php
class Funcionario {
    private $conn;
    private $table = "funcionarios";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll($filtros = []) {
        $query = "SELECT f.*, l.nome as loja_nome 
                  FROM " . $this->table . " f 
                  LEFT JOIN lojas l ON f.loja_id = l.id";
        
        $conditions = [];
        $params = [];

        if (!empty($filtros['nome'])) {
            $conditions[] = "f.nome LIKE :nome";
            $params[':nome'] = '%' . $filtros['nome'] . '%';
        }

        if (!empty($filtros['loja_id'])) {
            $conditions[] = "f.loja_id = :loja_id";
            $params[':loja_id'] = $filtros['loja_id'];
        }

        if (!empty($filtros['setor'])) {
            $conditions[] = "f.setor = :setor";
            $params[':setor'] = $filtros['setor'];
        }

        if (empty($filtros['incluir_inativos'])) {
            $conditions[] = "f.ativo = 1";
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " ORDER BY f.nome";

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $funcionarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Buscar acessos para cada funcionário
        foreach ($funcionarios as &$func) {
            $func['loja'] = $func['loja_nome'] ? ['nome' => $func['loja_nome']] : null;
            unset($func['loja_nome']);
            $func['acessos'] = $this->getAcessos($func['id'], $filtros['sistema_id'] ?? null);
        }

        // Filtrar por sistema se necessário
        if (!empty($filtros['sistema_id'])) {
            $funcionarios = array_filter($funcionarios, function($f) {
                return !empty($f['acessos']);
            });
            $funcionarios = array_values($funcionarios);
        }

        return $funcionarios;
    }

    private function getAcessos($funcionarioId, $sistemaId = null) {
        $query = "SELECT a.*, s.nome as sistema_nome, s.url as sistema_url 
                  FROM acessos a 
                  JOIN sistemas s ON a.sistema_id = s.id 
                  WHERE a.funcionario_id = :funcionario_id";
        
        $params = [':funcionario_id' => $funcionarioId];

        if ($sistemaId) {
            $query .= " AND a.sistema_id = :sistema_id";
            $params[':sistema_id'] = $sistemaId;
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $acessos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($acessos as &$acesso) {
            $acesso['sistema'] = [
                'id' => $acesso['sistema_id'],
                'nome' => $acesso['sistema_nome'],
                'url' => $acesso['sistema_url']
            ];
            unset($acesso['sistema_nome'], $acesso['sistema_url']);
        }

        return $acessos;
    }

    public function getById($id) {
        $query = "SELECT f.*, l.nome as loja_nome 
                  FROM " . $this->table . " f 
                  LEFT JOIN lojas l ON f.loja_id = l.id 
                  WHERE f.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        $func = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($func) {
            $func['loja'] = $func['loja_nome'] ? ['nome' => $func['loja_nome']] : null;
            unset($func['loja_nome']);
            $func['acessos'] = $this->getAcessos($id);
        }
        
        return $func;
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table . " (nome, email, tipo, loja_id, setor, ativo) 
                  VALUES (:nome, :email, :tipo, :loja_id, :setor, :ativo)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":nome", $data['nome']);
        $stmt->bindParam(":email", $data['email']);
        $stmt->bindParam(":tipo", $data['tipo']);
        $stmt->bindParam(":loja_id", $data['loja_id']);
        $stmt->bindParam(":setor", $data['setor']);
        $stmt->bindParam(":ativo", $data['ativo'], PDO::PARAM_BOOL);
        
        if ($stmt->execute()) {
            return $this->getById($this->conn->lastInsertId());
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $params = [":id" => $id];

        foreach (['nome', 'email', 'tipo', 'loja_id', 'setor', 'ativo'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $query = "UPDATE " . $this->table . " SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($params)) {
            return $this->getById($id);
        }
        return false;
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }
}
?>
```

### api/models/Acesso.php
```php
<?php
class Acesso {
    private $conn;
    private $table = "acessos";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getByFuncionario($funcionarioId) {
        $query = "SELECT a.*, s.nome as sistema_nome, s.url as sistema_url 
                  FROM " . $this->table . " a 
                  JOIN sistemas s ON a.sistema_id = s.id 
                  WHERE a.funcionario_id = :funcionario_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":funcionario_id", $funcionarioId);
        $stmt->execute();
        
        $acessos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($acessos as &$acesso) {
            $acesso['sistema'] = [
                'id' => $acesso['sistema_id'],
                'nome' => $acesso['sistema_nome'],
                'url' => $acesso['sistema_url']
            ];
            unset($acesso['sistema_nome'], $acesso['sistema_url']);
        }
        
        return $acessos;
    }

    public function getById($id) {
        $query = "SELECT a.*, s.nome as sistema_nome 
                  FROM " . $this->table . " a 
                  JOIN sistemas s ON a.sistema_id = s.id 
                  WHERE a.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table . " (funcionario_id, sistema_id, usuario, senha, observacao) 
                  VALUES (:funcionario_id, :sistema_id, :usuario, :senha, :observacao)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":funcionario_id", $data['funcionario_id']);
        $stmt->bindParam(":sistema_id", $data['sistema_id']);
        $stmt->bindParam(":usuario", $data['usuario']);
        $stmt->bindParam(":senha", $data['senha']);
        $stmt->bindParam(":observacao", $data['observacao']);
        
        if ($stmt->execute()) {
            return $this->getById($this->conn->lastInsertId());
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $params = [":id" => $id];

        foreach (['sistema_id', 'usuario', 'senha', 'observacao'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $query = "UPDATE " . $this->table . " SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        
        if ($stmt->execute($params)) {
            return $this->getById($id);
        }
        return false;
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }
}
?>
```

---

## 4. Controllers/Endpoints

### api/.htaccess
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# CORS Headers
Header always set Access-Control-Allow-Origin "http://localhost:5173"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
Header always set Access-Control-Allow-Credentials "true"

# Handle preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

### api/auth/login.php
```php
<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../models/Admin.php';

$database = new Database();
$db = $database->getConnection();
$admin = new Admin($db);

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->username) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["message" => "Dados incompletos"]);
    exit;
}

$result = $admin->login($data->username, $data->password);

if ($result) {
    $_SESSION['admin_id'] = $result['id'];
    $_SESSION['admin_username'] = $result['username'];
    $_SESSION['admin_nome'] = $result['nome'];
    
    echo json_encode([
        "success" => true,
        "data" => [
            "id" => $result['id'],
            "username" => $result['username'],
            "nome" => $result['nome']
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["message" => "Usuário ou senha inválidos"]);
}
?>
```

### api/auth/logout.php
```php
<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_destroy();
echo json_encode(["success" => true, "message" => "Logout realizado"]);
?>
```

### api/auth/check-session.php
```php
<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (isset($_SESSION['admin_id'])) {
    echo json_encode([
        "success" => true,
        "data" => [
            "id" => $_SESSION['admin_id'],
            "username" => $_SESSION['admin_username'],
            "nome" => $_SESSION['admin_nome']
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["message" => "Não autenticado"]);
}
?>
```

### api/lojas/index.php
```php
<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Check authentication
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "Não autenticado"]);
    exit;
}

require_once '../config/database.php';
require_once '../models/Loja.php';

$database = new Database();
$db = $database->getConnection();
$loja = new Loja($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($method) {
    case 'GET':
        if ($id) {
            $result = $loja->getById($id);
            if ($result) {
                echo json_encode(["success" => true, "data" => $result]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Loja não encontrada"]);
            }
        } else {
            $result = $loja->getAll();
            echo json_encode(["success" => true, "data" => $result]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $loja->create($data);
        if ($result) {
            http_response_code(201);
            echo json_encode(["success" => true, "data" => $result]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao criar loja"]);
        }
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "ID não informado"]);
            exit;
        }
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $loja->update($id, $data);
        if ($result) {
            echo json_encode(["success" => true, "data" => $result]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao atualizar loja"]);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "ID não informado"]);
            exit;
        }
        if ($loja->delete($id)) {
            echo json_encode(["success" => true, "message" => "Loja excluída"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao excluir loja"]);
        }
        break;
}
?>
```

### api/sistemas/index.php
```php
<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "Não autenticado"]);
    exit;
}

require_once '../config/database.php';
require_once '../models/Sistema.php';

$database = new Database();
$db = $database->getConnection();
$sistema = new Sistema($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$incluirInativos = isset($_GET['incluir_inativos']) && $_GET['incluir_inativos'] == '1';

switch ($method) {
    case 'GET':
        if ($id) {
            $result = $sistema->getById($id);
            if ($result) {
                echo json_encode(["success" => true, "data" => $result]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Sistema não encontrado"]);
            }
        } else {
            $result = $sistema->getAll($incluirInativos);
            echo json_encode(["success" => true, "data" => $result]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $sistema->create($data);
        if ($result) {
            http_response_code(201);
            echo json_encode(["success" => true, "data" => $result]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao criar sistema"]);
        }
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "ID não informado"]);
            exit;
        }
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $sistema->update($id, $data);
        if ($result) {
            echo json_encode(["success" => true, "data" => $result]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao atualizar sistema"]);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "ID não informado"]);
            exit;
        }
        if ($sistema->delete($id)) {
            echo json_encode(["success" => true, "message" => "Sistema excluído"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao excluir sistema"]);
        }
        break;
}
?>
```

### api/funcionarios/index.php
```php
<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "Não autenticado"]);
    exit;
}

require_once '../config/database.php';
require_once '../models/Funcionario.php';

$database = new Database();
$db = $database->getConnection();
$funcionario = new Funcionario($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($method) {
    case 'GET':
        if ($id) {
            $result = $funcionario->getById($id);
            if ($result) {
                echo json_encode(["success" => true, "data" => $result]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Funcionário não encontrado"]);
            }
        } else {
            $filtros = [
                'nome' => $_GET['nome'] ?? null,
                'loja_id' => $_GET['loja_id'] ?? null,
                'setor' => $_GET['setor'] ?? null,
                'sistema_id' => $_GET['sistema_id'] ?? null,
                'incluir_inativos' => isset($_GET['incluir_inativos']) && $_GET['incluir_inativos'] == '1'
            ];
            $result = $funcionario->getAll($filtros);
            echo json_encode(["success" => true, "data" => $result]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $funcionario->create($data);
        if ($result) {
            http_response_code(201);
            echo json_encode(["success" => true, "data" => $result]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao criar funcionário"]);
        }
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "ID não informado"]);
            exit;
        }
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $funcionario->update($id, $data);
        if ($result) {
            echo json_encode(["success" => true, "data" => $result]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao atualizar funcionário"]);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "ID não informado"]);
            exit;
        }
        if ($funcionario->delete($id)) {
            echo json_encode(["success" => true, "message" => "Funcionário excluído"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao excluir funcionário"]);
        }
        break;
}
?>
```

### api/acessos/index.php
```php
<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "Não autenticado"]);
    exit;
}

require_once '../config/database.php';
require_once '../models/Acesso.php';

$database = new Database();
$db = $database->getConnection();
$acesso = new Acesso($db);

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$funcionarioId = isset($_GET['funcionario_id']) ? intval($_GET['funcionario_id']) : null;

switch ($method) {
    case 'GET':
        if ($funcionarioId) {
            $result = $acesso->getByFuncionario($funcionarioId);
            echo json_encode(["success" => true, "data" => $result]);
        } elseif ($id) {
            $result = $acesso->getById($id);
            if ($result) {
                echo json_encode(["success" => true, "data" => $result]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Acesso não encontrado"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "ID do funcionário ou acesso não informado"]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $acesso->create($data);
        if ($result) {
            http_response_code(201);
            echo json_encode(["success" => true, "data" => $result]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao criar acesso"]);
        }
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "ID não informado"]);
            exit;
        }
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $acesso->update($id, $data);
        if ($result) {
            echo json_encode(["success" => true, "data" => $result]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao atualizar acesso"]);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["message" => "ID não informado"]);
            exit;
        }
        if ($acesso->delete($id)) {
            echo json_encode(["success" => true, "message" => "Acesso excluído"]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao excluir acesso"]);
        }
        break;
}
?>
```

---

## 7. Arquivo .htaccess para a API (api/.htaccess)

```apache
# Habilitar CORS para requisições do React
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "http://localhost:5173"
    Header set Access-Control-Allow-Credentials "true"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Tratar requisições OPTIONS (preflight)
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

---

## 8. Deploy do Frontend React no Apache (Opcional)

Se quiser fazer deploy do frontend React no mesmo servidor Apache (ao invés de usar o Lovable preview), siga os passos:

### 8.1. Build do Projeto React
Execute no terminal do projeto Lovable (ou baixe e execute localmente):
```bash
npm run build
```

Isso criará a pasta `dist/` com os arquivos estáticos.

### 8.2. Copiar para o XAMPP
Copie o conteúdo da pasta `dist/` para `C:\xampp\htdocs\admin-senhas\` (NÃO dentro da pasta `api/`).

Estrutura final:
```
C:\xampp\htdocs\admin-senhas\
├── index.html          <- arquivo do React
├── assets/             <- JS e CSS compilados
├── api/                <- backend PHP
│   ├── config/
│   ├── models/
│   ├── auth/
│   ├── lojas/
│   ├── sistemas/
│   ├── funcionarios/
│   ├── acessos/
│   └── .htaccess
└── .htaccess           <- arquivo para SPA routing
```

### 8.3. Arquivo .htaccess para o Frontend React (raiz: `C:\xampp\htdocs\admin-senhas\.htaccess`)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /admin-senhas/
    
    # Não reescrever arquivos e diretórios existentes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Não reescrever requisições para a API
    RewriteCond %{REQUEST_URI} !^/admin-senhas/api/
    
    # Redirecionar tudo para index.html (React Router)
    RewriteRule ^ index.html [L]
</IfModule>

# Tipos MIME corretos para assets
<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType text/css .css
</IfModule>
```

### 8.4. Atualizar Configuração da API
Se o frontend estiver rodando no mesmo servidor, atualize `src/config/api.ts` ANTES do build:

```typescript
// Para deploy no mesmo servidor Apache
export const API_BASE_URL = '/admin-senhas/api';
```

### 8.5. Habilitar mod_rewrite no Apache
1. Abra `C:\xampp\apache\conf\httpd.conf`
2. Descomente (remova o #): `LoadModule rewrite_module modules/mod_rewrite.so`
3. Procure por `AllowOverride None` dentro de `<Directory "C:/xampp/htdocs">` e mude para `AllowOverride All`
4. Reinicie o Apache

---

## Instruções de Instalação

### 1. Configurar MySQL
1. Abra o XAMPP e inicie Apache e MySQL
2. Acesse http://localhost/phpmyadmin
3. Copie e execute o script SQL da seção 1

### 2. Configurar Backend PHP
1. Crie a pasta `C:\xampp\htdocs\admin-senhas\api\`
2. Copie todos os arquivos PHP para suas respectivas pastas
3. Crie o arquivo `.htaccess` dentro da pasta `api/` (seção 7)
4. Verifique se o Apache tem mod_rewrite habilitado

### 3. Configurar Frontend (Opção A: Lovable Preview)
1. No arquivo `src/config/api.ts`, a URL já está configurada para `http://localhost/admin-senhas/api`
2. Acesse pelo preview do Lovable

### 3. Configurar Frontend (Opção B: Deploy no Apache)
1. Siga as instruções da seção 8
2. Acesse: `http://localhost/admin-senhas/`

### 4. Testar
1. Faça login com: **admin / admin123**

### Problemas de CORS no XAMPP
Se tiver problemas de CORS ao usar o Lovable preview, edite `C:\xampp\apache\conf\httpd.conf`:
1. Descomente a linha: `LoadModule headers_module modules/mod_headers.so`
2. Reinicie o Apache

### Problemas de 404 nos Assets (JS/CSS)
1. Verifique se o `.htaccess` está na raiz do projeto (`C:\xampp\htdocs\admin-senhas\.htaccess`)
2. Confirme que `mod_rewrite` está habilitado
3. Confirme que `AllowOverride All` está configurado para o diretório
4. Reinicie o Apache após as alterações

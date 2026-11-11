<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../../config/Database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->title) &&
    !empty($data->short_description) &&
    !empty($data->full_description) &&
    !empty($data->category_id) &&
    !empty($data->instructor_id)
){
    $query = "INSERT INTO courses SET 
                title=:title, 
                short_description=:short_description, 
                full_description=:full_description, 
                category_id=:category_id, 
                instructor_id=:instructor_id, 
                difficulty=:difficulty,
                status='published'";

    $stmt = $db->prepare($query);

    $title = htmlspecialchars(strip_tags($data->title));
    $short_description = htmlspecialchars(strip_tags($data->short_description));
    $full_description = htmlspecialchars(strip_tags($data->full_description));
    $category_id = htmlspecialchars(strip_tags($data->category_id));
    $instructor_id = htmlspecialchars(strip_tags($data->instructor_id));
    $difficulty = isset($data->difficulty) ? htmlspecialchars(strip_tags($data->difficulty)) : 'beginner';

    $stmt->bindParam(":title", $title);
    $stmt->bindParam(":short_description", $short_description);
    $stmt->bindParam(":full_description", $full_description);
    $stmt->bindParam(":category_id", $category_id);
    $stmt->bindParam(":instructor_id", $instructor_id);
    $stmt->bindParam(":difficulty", $difficulty);

    if($stmt->execute()){
        http_response_code(201);
        echo json_encode(array("message" => "Course was created."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create course."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create course. Data is incomplete."));
}
?>

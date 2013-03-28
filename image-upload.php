<?php
/*
Template Name: UploadImage

Allow users to upload images
*/

/** started life as php.php from https://github.com/valums/file-uploader **/

/**
 * Handle file uploads via XMLHttpRequest
 */
class qqUploadedFileXhr {
    /**
     * Save the file to the specified path
     * @return boolean TRUE on success
     */
    function save($path) {
        $input = fopen("php://input", "r");
        $temp = tmpfile();
        $realSize = stream_copy_to_stream($input, $temp);
        fclose($input);

        if ($realSize != $this->getSize()){
            return false;
        }

        $target = fopen($path, "w");
        fseek($temp, 0, SEEK_SET);
        stream_copy_to_stream($temp, $target);
        fclose($target);

        return true;
    }
    function getName() {
        return $_GET['qqfile'];
    }
    function getSize() {
        if (isset($_SERVER["CONTENT_LENGTH"])){
            return (int)$_SERVER["CONTENT_LENGTH"];
        } else {
            throw new Exception('Getting content length is not supported.');
        }
    }
}

/**
 * Handle file uploads via regular form post (uses the $_FILES array)
 */
class qqUploadedFileForm {
    /**
     * Save the file to the specified path
     * @return boolean TRUE on success
     */
    function save($path) {
        if(!move_uploaded_file($_FILES['qqfile']['tmp_name'], $path)){
            return false;
        }
        return true;
    }
    function getName() {
        return $_FILES['qqfile']['name'];
    }
    function getSize() {
        return $_FILES['qqfile']['size'];
    }
}

class qqFileUploader {
    private $allowedExtensions = array();
    private $sizeLimit = 10485760;
    private $file;

    function __construct(array $allowedExtensions = array(), $sizeLimit = 10485760){
        $allowedExtensions = array_map("strtolower", $allowedExtensions);

        $this->allowedExtensions = $allowedExtensions;
        $this->sizeLimit = $sizeLimit;

        $this->checkServerSettings();

        if (isset($_GET['qqfile'])) {
            $this->file = new qqUploadedFileXhr();
        } elseif (isset($_FILES['qqfile'])) {
            $this->file = new qqUploadedFileForm();
        } else {
            $this->file = false;
        }
    }

    private function checkServerSettings(){
        $postSize = $this->toBytes(ini_get('post_max_size'));
        $uploadSize = $this->toBytes(ini_get('upload_max_filesize'));

        if ($postSize < $this->sizeLimit || $uploadSize < $this->sizeLimit){
            $size = max(1, $this->sizeLimit / 1024 / 1024) . 'M';
            die("{'error':'increase post_max_size and upload_max_filesize to $size'}");
        }
    }

    private function toBytes($str){
        $val = trim($str);
        $last = strtolower($str[strlen($str)-1]);
        switch($last) {
            case 'g': $val *= 1024;
            case 'm': $val *= 1024;
            case 'k': $val *= 1024;
        }
        return $val;
    }

    /**
     * Returns array('success'=>true) or array('error'=>'error message')
     */
    function handleUpload($uploadDirectory){
        if (!is_writable($uploadDirectory)){
            return array('error' => "Server error. Upload directory isn't writable.");
        }

        if (!$this->file){
            return array('error' => 'No files were uploaded.');
        }

        $size = $this->file->getSize();

        if ($size == 0) {
            return array('error' => 'File is empty');
        }

        if ($size > $this->sizeLimit) {
            return array('error' => 'File is too large');
        }

        $pathinfo = pathinfo($this->file->getName());
        $filename = $pathinfo['filename'];
        //$filename = md5(uniqid());
        $ext = strtolower($pathinfo['extension']);

        if($this->allowedExtensions && !in_array(strtolower($ext), $this->allowedExtensions)){
            $these = implode(', ', $this->allowedExtensions);
            return array('error' => 'File has an invalid extension, it should be one of '. $these . '.');
        }

        $path = $uploadDirectory . uniqid() . '.' . $ext;
        if ($this->file->save($path)){
            return array('success'=>true, 'path'=> $path, 'type'=>$ext);
        } else {
            return array('error'=> 'Could not save uploaded file.' .
                'The upload was cancelled, or server error encountered');
        }

    }
}

function processUploadedImage($path, $type) {
    if ($type == 'gif') {
        $im = imagecreatefromgif($path);
    } elseif ($type == 'png') {
        $im = imagecreatefrompng($path);
    } elseif ($type == 'jpg' || $type == 'jpeg') {
        $im = imagecreatefromjpeg($path);
    } else {
        return array('error'=>'invalid file type ' . $type);
    }
    if (!$im) {
        return array('error'=>'bad image file');
    }
    // fix the orientation
    $exif = exif_read_data($path);

    if (!empty($exif['Orientation'])) {
        switch ($exif['Orientation']) {
            case 3:
                $im = imagerotate($im, 180, 0);
                break;

            case 6:
                $im = imagerotate($im, -90, 0);
                break;

            case 8:
                $im = imagerotate($im, 90, 0);
                break;
        }
    }

    global $userdata;
    get_currentuserinfo();
    $userid = $userdata->ID;

    $upl = wp_upload_dir();

    $basename = '/' . $userid . '-' . uniqid();

    // let the book POST code handle saving the thumbnail.
    // save the medium size
    list($nim, $nw, $nh) = resizeImage($im, 500, false);
    $mname = $basename . '.jpg';
    $path = $upl['path'] . $mname;
    imagejpeg($nim, $path);

    return array('success'=>true, 'url'=>$upl['url'] . $mname, 'width'=>$nw, 'height'=>$nh, 'path'=>$path);
}

if (!current_user_can('edit_posts')) {
    header("HTTP/1.0 401 Not Authorized");
    die();
}

// list of valid extensions, ex. array("jpeg", "xml", "bmp")
$allowedExtensions = array("jpg", "jpeg", "png", "gif");
// max file size in bytes
$sizeLimit = 10 * 1024 * 1024;

$uploader = new qqFileUploader($allowedExtensions, $sizeLimit);
$result = $uploader->handleUpload('/var/tmp/');
if ($result['success']) {
    $path = $result['path'];
    $result = processUploadedImage($path, $result['type']);
    unlink($path);
}
// to pass data through iframe you will need to encode all html tags
echo htmlspecialchars(json_encode($result), ENT_NOQUOTES);

<?php
/*
Template Name: DownloadBook

GET: /download/?id=12345&type=ppt  return PowerPoint for a book
*/

/* Slide appears to be 960 by 720
*/

/** Error reporting */
//error_reporting(E_ALL);

/** Include path **/
set_include_path(get_include_path() . PATH_SEPARATOR . '/var/www/tarheelreader/theme/Classes/');

/** PHPPowerPoint */
include 'PHPPowerPoint.php';

/** PHPPowerPoint_IOFactory */
include 'PHPPowerPoint/IOFactory.php';

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    // get the parameters
    $id = getParam('id', 0, '/\d+/');
    if ($id) {
        $post = get_post($id);
        if (!$post) {
            header("HTTP/1.0 404 Not Found");
            die();
        }
    } else {
        $slug = getParam('slug', '', '/[^\/]+/');
        if ($slug) {
            query_posts("cat=3&name=$slug");
            if(have_posts()) {
                the_post();
            } else {
                header("HTTP/1.0 404 Not Found");
                die();
            }
        } else {
            header("HTTP/1.0 400 Bad Parameter");
            die();
        }
    }
    $type = getParam('type', '', '/pptx/');
    $book = ParseBookPost($post);

    $path = tempnam('/tmp', 'pptx');
    if ($type == 'pptx') {
        CreatePPTXFromBook($path, $book);
    }
    $fp = fopen($path, 'rb');
    header('Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation');
    header('Content-Disposition: attachment; filename="' . $book['slug'] . '.pptx"');
    header('Content-Size: ' . filesize($path));
    fpassthru($fp);
    fclose($fp);
    unlink($path);
    exit;
}

function imgPath($url) {
    $result = ABSPATH . str_replace('%20', ' ', substr($url, 1));
    return $result;
}

function CreatePPTXFromBook($path, $book) {
    $objPHPPowerPoint = new PHPPowerPoint();

    // Set properties
    $objPHPPowerPoint->getProperties()->setCreator($book['author']);
    $objPHPPowerPoint->getProperties()->setTitle($book['title']);
    $objPHPPowerPoint->getProperties()->setSubject("Downloaded book from Tar Heel Reader");
    $objPHPPowerPoint->getProperties()->setDescription("May not be sold.");
    $objPHPPowerPoint->getProperties()->setKeywords(implode(', ', $book['tags']));
    $objPHPPowerPoint->getProperties()->setCategory(implode(', ', $book['categories']));

    // title slide
    $currentSlide = $objPHPPowerPoint->getActiveSlide();
    $page = $book['pages'][1];
    $shape = $currentSlide->createDrawingShape();
    $shape->setName('title picture');
    $shape->setDescription('picture credit?');
    $shape->setPath(imgPath($page['url']));
    $shape->setHeight($page['height']);
    $shape->setOffsetX((960 - $page['width']) / 2);
    $shape->setOffsetY(200 + (500 - $page['height']) / 2);

    // Create a shape (text)
    $shape = $currentSlide->createRichTextShape();
    $shape->setHeight(200);
    $shape->setWidth(960);
    $shape->setOffsetX(0);
    $shape->setOffsetY(20);
    $shape->getAlignment()->setHorizontal( PHPPowerPoint_Style_Alignment::HORIZONTAL_CENTER );

    $textRun = $shape->createTextRun($book['title']);
    $textRun->getFont()->setBold(true);
    $textRun->getFont()->setSize(28);

    $shape->createBreak();

    $textRun = $shape->createTextRun($book['author']);
    $textRun->getFont()->setBold(true);
    $textRun->getFont()->setSize(22);

    $npages = count($book['pages']);
    for ($i = 1; $i < $npages; $i++) {
        $page = $book['pages'][$i];

        // Create slide
        $currentSlide = $objPHPPowerPoint->createSlide();

        $shape = $currentSlide->createDrawingShape();
        $shape->setName('Picture');
        $shape->setDescription('page picture');
        $shape->setPath(imgPath($page['url']));
        $shape->setHeight($page['height']);
        $shape->setOffsetX((960 - $page['width']) / 2);  // (960 - width) / 2
        $shape->setOffsetY(10 + (500 - $page['height']) / 2);

        // Create a shape (text)
        $shape = $currentSlide->createRichTextShape();
        $shape->setHeight(100);
        $shape->setWidth(960);
        $shape->setOffsetX(0);
        $shape->setOffsetY(550);
        $shape->getAlignment()->setHorizontal( PHPPowerPoint_Style_Alignment::HORIZONTAL_CENTER );

        $textRun = $shape->createTextRun($page['text']);
        $textRun->getFont()->setBold(true);
        $textRun->getFont()->setSize(30);

        // Create a shape (text)
        $shape = $currentSlide->createRichTextShape();
        $shape->setHeight(40);
        $shape->setWidth(100);
        $shape->setOffsetX(840);
        $shape->setOffsetY(20);
        $shape->getAlignment()->setHorizontal( PHPPowerPoint_Style_Alignment::HORIZONTAL_RIGHT );

        $textRun = $shape->createTextRun($i+1);
        $textRun->getFont()->setBold(true);
        $textRun->getFont()->setSize(15);

    }
    // Save PowerPoint 2007 file
    $objWriter = PHPPowerPoint_IOFactory::createWriter($objPHPPowerPoint, 'PowerPoint2007');
    $objWriter->save($path);
}


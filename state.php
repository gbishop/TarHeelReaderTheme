<?php

/* manage the state that is shared between the javascript and php versions of the code */

/* state array with default values */
$THRDefault = array(
    // the current query parameters
    'reviewed' => 'R',    // R for yes, empty for no
    'language' => 'en',   // 2 or 3 letter language code
    'count' => 23,        // number of books per page
    'page' => 1,          // current page starting from 1
    'category' => '',     // 2-letter category codes, limit to this category if not empty
    'type' => '',         // T=Transitional C=Conventional O=Other, empty is any
    'audience' => 'E',    // C=caution E=Everybody, empty is any
    'search' => '',       // search words
    'pageColor' => 'fff', // color of the background
    'textColor' => '000', // color of text
    'voice' => 'silent',  // voice to use silent, male, female, child
    'locale' => 'en',     // users language for supporting translations of the site
    'favorites' => '',    // list of favorite ids
    'findAnotherLink' => '/find/' // URL to return to book search
);

$THRState = $THRDefault;

/* regular expressions for legal parameter values */
$THRPatterns = array(
    'reviewed' => '/^R?$/',    // R for yes, empty for no
    'language' => '/^([a-z]{2,3})?$/', // 2 or 3 letter language code or empty for don't care
    'count' => '/^\d+$/',      // number of books per page
    'page' => '/^\d+$/',        // current page starting from 1
    'category' => '/^([A-Za-z]{4})?$/',   // 4-letter category codes, limit to this category if not empty
    'type' => '/^[TCO]?$/',       // T=Transitional C=Conventional O=Other, empty is any
    'audience' => '/^[CE]?$/',   // C=caution E=Everybody, empty is any
    'search' => '/^.*$/',      // search words
    'pageColor' => '/^[f0]{3}$/',  // color of the background
    'textColor' => '/^[f0]{3}$/',  // color of text
    'voice' => '/^silent|male|female|child$/',    // voice to use silent, male, female, child
    'locale' => '/^[a-z]{2,3}$/',  // users language for supporting translations of the site
    'favorites' => '/^\d+(,\d+)*$/',   // comma separated integers
    'findAnotherLink' => '/^.*$/'
);

function thrUpdateState(&$current, $update, $patterns) {
    $changed = 0; // track number of changes
    foreach($update as $param => $value) {
        if (array_key_exists($param, $patterns)) {
            if (preg_match($patterns[$param], $value)) {
                $current[$param] = stripslashes(urldecode($value));
                $changed += 1;
            } else {
                return false; // signal error
            }
        }
    }
    return $changed;
}

$setCookie = 0; // non-zero if we need to set the cookie

// retrieve the past state from the cookie
if (array_key_exists('thr', $_COOKIE)) {
    $json = $_COOKIE['thr'];
    $json = stripslashes($json); // magic quotes?
    $value = json_decode($json, true);
    if ($value === NULL) {
        $setCookie = 1;
    } elseif (thrUpdateState($THRState, $value, $THRPatterns) === false) {
        $setCookie = 1;
    }
} else {
    $setCookie = 1;
}

// apply any incoming parameters to the state
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $setCookie = thrUpdateState($THRState, $_GET, $THRPatterns);
    if ($setCookie === false) {
        header("HTTP/1.0 400 Invalid Parameter");
        die();
    }
}

// we don't yet support reviewing for languages other than English and Latin
if (!in_array(THR('language'), array('en', 'la')) && $THRState['reviewed'] == 'R') {
    $setCookie = 1;
    $THRState['reviewed'] = '';
}

function thr_setcookie() {
    global $setCookie, $THRState;

    // if we updated the state, the set the cookie
    if ($setCookie > 0) {
        setcookie('thr', json_encode($THRState), 0, '/');
    }
}

// global function for getting state values
function THR($p = null) {
    global $THRState;
    if (!$p) return $THRState;
    return $THRState[$p];
}

// global function for setting state values
function setTHR($p, $v) {
    global $THRState, $setCookie;
    $old = $THRState[$p];

    if ($old != $v) {
        $setCookie = 1;
        $THRState[$p] = $v;
    }
    return $old;
}

// global function for constructing a URL to restore the query parts of the state.
function find_url($page = null) {
    global $THRState, $THRDefault;
    $p = array();
    foreach(array('search', 'category', 'reviewed', 'audience', 'language') as $parm) {
        $v = urlencode($THRState[$parm]);
        $p[] = "$parm=$v";
    }
    if ($page === null) {
        $page = $THRState['page'];
    }
    $p[] = "page=$page";

    if (count($p) > 0) {
        return '/find/?' . implode('&', $p);
    } else {
        return '/find/';
    }
}

function favorites_url($page = null) {
    global $THRState, $THRDefault;
    $p = array();
    foreach(array('pageColor', 'textColor', 'voice', 'favorites') as $parm) {
        $v = urlencode($THRState[$parm]);
        $p[] = "$parm=$v";
    }
    if ($page === null) {
        $page = $THRState['page'];
    }
    $p[] = "page=$page";

    if (count($p) > 0) {
        return '/favorites/?' . implode('&', $p);
    } else {
        return '/favorites/';
    }
}
?>

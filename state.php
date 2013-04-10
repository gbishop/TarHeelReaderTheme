<?php

/* manage the state that is shared between the javascript and php versions of the code */

$contents = file_get_contents("state.json", FILE_USE_INCLUDE_PATH);
$THRStateRules = json_decode($contents, true);

$THRState = array();
// setup state default
foreach($THRStateRules as $param => $rule) {
    $THRState[$param] = $rule['default'];
}

function splitFavorites($str) {
    if ($str) {
        preg_match_all('/\d+/', $str, $matches);
        $favs = $matches[0];
    } else {
        $favs = array();
    }
    return $favs;
}

$setCookie = 0; // non-zero if we need to set the cookie

// retrieve the past state from the cookie
if (array_key_exists('thr', $_COOKIE)) {
    $json = $_COOKIE['thr'];
    $json = stripslashes($json); // magic quotes?
    $cookie = json_decode($json, true);
    if ($cookie !== NULL) {
        foreach($cookie as $param => $value) {
            setTHR($param, $value);
        }
    } else {
        $setCookie = 1;
    }
} else {
    $setCookie = 1;
}

// apply any incoming parameters to the state
if ($_SERVER['REQUEST_METHOD'] == 'GET' && !array_key_exists('p', $_GET)) {
    foreach($_GET as $param => $value) {
        if ($param == 'favorites') {
            $THRState['collection'] = ''; // clear the collection anytime favorites are directly set
            $favs = splitFavorites($THRState['favorites']);
            $ids = splitFavorites($value);
            if (strpos($value, 'A') === 0) { // add the book
                $favs = array_unique(array_merge($favs, $ids));
            } elseif (strpos($value, 'R') === 0) { // remove the book
                $favs = array_diff($favs, $ids);
            } else { // replace all favorites
                $favs = $ids;
            }
            $value = implode(',', $favs);
        }
        setTHR($param, $value);
    }
}

// we don't yet support reviewing for languages other than English and Latin
if (!in_array(THR('language'), array('en', 'la')) && $THRState['reviewed'] == 'R') {
    $setCookie = 1;
    setTHR('reviewed', '');
}

function thr_setcookie($force=0) {
    global $setCookie, $THRState;

    // if we updated the state, the set the cookie
    if ($force || $setCookie > 0) {
        setcookie('thr', json_encode($THRState), 0, '/');
        $setCookie = 0;
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
    global $THRState, $setCookie, $THRStateRules, $log;
    if (!array_key_exists($p, $THRStateRules)) {
        return false;
    }

    $old = $THRState[$p];
    $pattern = $THRStateRules[$p]['pattern'];
    $pattern = $pattern ? '/' . $pattern . '/' : NULL;

    if ($old != $v) {
        if(!$pattern || preg_match($pattern, $v)) {
            $setCookie = 1;
            $THRState[$p] = $v;
        } else {
            $log->logError("set error p=$p v=$v", $THRState);
        }
    }
    return true;
}

// global function for constructing a URL to restore the query parts of the state.
function find_url($page = null) {
    global $THRState;
    $p = array();
    foreach(array('search', 'category', 'reviewed', 'audience', 'language') as $parm) {
        $v = urlencode($THRState[$parm]);
        $p[] = "$parm=$v";
    }
    if ($page === null) {
        $page = THR('page');
    }
    $p[] = "page=$page";

    if (count($p) > 0) {
        return '/find/?' . implode('&', $p);
    } else {
        return '/find/';
    }
}

function favorites_url($fpage = null) {
    global $THRState;
    $p = array();
    $parms = array('pageColor', 'textColor', 'voice');
    if ($THRState['collection']) {
        $parms[] = 'collection';
    } else {
        $parms[] = 'favorites';
    }
    foreach($parms as $parm) {
        $v = $THRState[$parm];
        $p[] = "$parm=$v";
    }
    if ($fpage === null) {
        $fpage = THR('fpage');
    }
    $p[] = "fpage=$fpage";

    if (count($p) > 0) {
        return '/favorites/?' . implode('&', $p);
    } else {
        return '/favorites/';
    }
}
?>

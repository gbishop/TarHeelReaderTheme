*** Settings ***

Library  Selenium2Library  timeout=15.0
Library  SauceLabs

Test Setup  Open test browser
Test Teardown  Close test browser

*** Variables ***

${BROWSER}  googlechrome
${REMOTE_URL}
${DESIRED_CAPABILITIES}

${LOGIN_FAIL_MSG}  Incorrect username or password.

${MENU}  css=.active-page a.thr-well-icon
${HEART}  css=a.thr-favorites-icon

*** Test Cases ***

Welcome page
    Open home page
    Page should contain  Welcome
    Page should contain link  ${MENU}

Book reading
    Open home page
    Read a book

Offline reading page
    Open home page
    Open offline reading page
    Page should contain button  Read offline
    Page should contain button  Add Favorites to local books
    Page should contain button  Clear all local books
    Page should contain button  Clear selected local books

Choosing favorites
    #Set selenium speed  0.1
    Open home page
    Select favorites
    Open favorites page
    ${count}=  execute javascript  return $('.active-page li.selectable').length
    Should be true  ${count}==4

Read a book offline
    #Set selenium speed  0.2
    Open home page
    Select favorites
    Open offline reading page
    Click button  Add Favorites to local books
    Wait until element is visible  css=div.busyBlocker
    Wait for condition  return $('div.busyBlocker:visible').length==0  timeout=60
    ${count}=  execute javascript  return $('#offlineBooks li').length
    Should be true  ${count}==4
    Click button  Read offline
    Wait until element is visible  css=button#goOnline
    ${astart}=  execute javascript  return window.thr_ajax_count
    Read a book
    ${aend}=  execute javascript  return window.thr_ajax_count
    Should be true  ${astart}==${aend}

*** Keywords ***

Open test browser
    Open browser  about:  ${BROWSER}
    ...  remote_url=${REMOTE_URL}
    ...  desired_capabilities=${DESIRED_CAPABILITIES}

Open home page
    [arguments]  ${options}=
    Go to  http://gbserver3.cs.unc.edu/${options}
    Wait until page contains  Welcome

Open navigation menu
    [arguments]  ${target}=li.homeLink
    Click link  ${MENU}
    Wait until element is visible  css=.active-page ${target}

Open offline reading page
    #Open home page
    Open navigation menu  li.offlineLink
    Click element  css=.active-page li.offlineLink a
    Wait until element is visible  css=button#goOffline

Open find page
    Open navigation menu
    Click element  css=.active-page li.findLink a
    Wait until page appears  find-page

Wait until page appears
    [arguments]  ${class}
    Wait until element is visible  css=.active-page.${class}

Wait until search results appear
    [arguments]  ${count}=1
    Wait for condition  return $('.active-page ul.thr-book-list li.selectable').length==${count}

Open favorites page
    Open navigation menu
    Click link  css=.active-page li.favoritesLink a
    Wait until element is visible  css=.favorites-page

Select favorites
    Open find page
    Click link  ${HEART}
    #Wait until page contains  css=img.favoriteNo
    Click element  css=li.selectable:nth-child(3) img.favoriteNo
    Click element  css=li.selectable:nth-child(1) img.favoriteNo
    Click element  css=li.selectable:nth-child(2) img.favoriteNo
    Click element  css=li.selectable:nth-child(4) img.favoriteNo
    Click link  ${HEART}
    Wait for condition  return $('img.favoriteYes:visible').length==0 && $('img.favoriteNo:visible').length==0;

Read a book
    Open find page
    Input text  search  our garden karen
    Click button  Search
    Wait until search results appear  1
    Click element  css=.active-page ul.thr-book-list li.selectable a
    Turn page  2
    Turn page  3
    Turn page  4
    Turn page  5
    Turn page  6
    Turn page  7
    Turn page  8
    Click element  css=.active-page a.thr-next-link
    Wait until page contains  What would you like to do now?
    Click link  Rate this book.
    Wait until page contains  How do you rate this book?
    Click element  css=.active-page a.key-3
    Wait until page contains  Thank you
    Click element  css=.active-page a.key-d
    Wait until search results appear

Turn page
    [Arguments]    ${page}
    Wait for condition  return $('.active-page a.thr-next-link').length==1
    Click link  css=.active-page a.thr-next-link
    Wait until keyword succeeds  5s  0.1s  Check page number  ${page}

Check page number
    [Arguments]    ${page}
    ${value}=  execute javascript  return $('.active-page p.thr-page-number').text()
    Should be true  ${page}==${value}

Close test browser
    Run keyword if  '${REMOTE_URL}' != ''
    ...  Report Sauce status
    ...  ${SUITE_NAME} | ${TEST_NAME}
    ...  ${TEST_STATUS}  ${TEST_TAGS}  ${REMOTE_URL}
    Close all browsers

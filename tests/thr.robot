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

Offline reading page
    Open offline reading page
    Page should contain button  Go Offline
    Page should contain button  Add Favorites
    Page should contain button  Clear All
    Page should contain button  Clear Selected

Choosing favorites
    #Set selenium speed  0.1
    Select favorites
    Open favorites page
    ${count}=  execute javascript  return $('.active-page li.selectable').length
    Should be true  ${count}==4

Add favorites to offline
    #Set selenium speed  1
    Select favorites
    Open offline reading page
    Click button  Add Favorites
    Wait until element is visible  css=div.busyBlocker
    Wait for condition  return $('div.busyBlocker:visible').length==0  timeout=60
    ${count}=  execute javascript  return $('#offlineBooks li').length
    Should be true  ${count}==4

*** Keywords ***

Open test browser
    Open browser  about:  ${BROWSER}
    ...  remote_url=${REMOTE_URL}
    ...  desired_capabilities=${DESIRED_CAPABILITIES}

Open home page
    Go to  http://gbserver3.cs.unc.edu
    Wait until page contains  Welcome

Open navigation menu
    Click link  ${MENU}
    Wait until element is visible  css=.active-page li.homeLink

Open offline reading page
    Open home page
    Open navigation menu
    Click link  Offline reading
    Wait until page contains  Go Offline

Open find page
    Open home page
    Open navigation menu
    Click link  Find a book
    Wait until page contains  More Books

Open favorites page
    Open navigation menu
    Click link  css=.active-page li.favoritesLink a
    #Wait until page contains  css=.active-page li.selectable.favoritePage

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

Close test browser
    Run keyword if  '${REMOTE_URL}' != ''
    ...  Report Sauce status
    ...  ${SUITE_NAME} | ${TEST_NAME}
    ...  ${TEST_STATUS}  ${TEST_TAGS}  ${REMOTE_URL}
    Close all browsers

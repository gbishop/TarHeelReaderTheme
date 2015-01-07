test: thr.robot
	robot/bin/pybot $^
REMOTE=-v REMOTE_URL:http://$(SAUCE_USER):$(SAUCE_KEY)@ondemand.saucelabs.com:80/wd/hub

win8ie11: thr.robot
	robot/bin/pybot -v DESIRED_CAPABILITIES:"platform:Windows 2012 R2,browserName:internet explorer,version:11" $(REMOTE) $^

winxpie8: thr.robot
	robot/bin/pybot -v DESIRED_CAPABILITIES:"platform:Windows XP,browserName:internet explorer,version:8" $(REMOTE) $^

win7ie11: thr.robot
	robot/bin/pybot -v DESIRED_CAPABILITIES:"platform:Windows 7,browserName:internet explorer,version:11" $(REMOTE) $^

ipad: thr.robot
	robot/bin/pybot -v DESIRED_CAPABILITIES:"platform:OS X 10.9,browserName:ipad,version:8.1" $(REMOTE) $^

macchrome: thr.robot
	robot/bin/pybot -v DESIRED_CAPABILITIES:"platform:OS X 10.9,browserName:googlechrome" $(REMOTE) $^

macfirefox: thr.robot
	robot/bin/pybot -v DESIRED_CAPABILITIES:"platform:OS X 10.9,browserName:firefox" $(REMOTE) $^

macsafari: thr.robot
	robot/bin/pybot -v DESIRED_CAPABILITIES:"platform:OS X 10.9,browserName:safari" $(REMOTE) $^

win7chrome: thr.robot
	robot/bin/pybot -v DESIRED_CAPABILITIES:"platform:Windows 7,browserName:googlechrome" $(REMOTE) $^

win7firefox: thr.robot
	robot/bin/pybot -v DESIRED_CAPABILITIES:"platform:Windows 7,browserName:firefox" $(REMOTE) $^


test-setup:
	virtualenv robot --no-site-packages
	robot/bin/pip install robotframework-selenium2library
	robot/bin/pip install simplejson requests

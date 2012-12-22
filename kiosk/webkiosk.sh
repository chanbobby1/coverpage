killall chromium-browser
ping -c 1 8.8.8.8
while [ $? -gt 0 ]
do
	ping -c 1 8.8.8.8
done
export DISPLAY=:0
chromium-browser --kiosk --no-context-menu --incognito http://coverpage.eliot.ca &

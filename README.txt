How to quickly install mapfishapp:
---------------------------------

Note: this is for dev/evaluation purposes only

Just type :
 mvn jetty:run
 
...from the current path (mapfishapp)


At the end of the process, open http://localhost:8080/mapfishapp/?debug=true or
http://localhost:8080/mapfishapp/ in your browser

?debug=true appended at the end of the URL makes you use unbuilded javascript, which means you can live-test your modifications in the client-side code.

For authentication, you can fool the module by installing the firefox extension "modify headers" (https://addons.mozilla.org/en-US/firefox/addon/modify-headers/)

In the extension config, activate those rules :
 add / sec-roles / ROLE_SV_ADMIN (or any others at your convenience, separated by commas)
 add / sec-username / yourname
 add / sec-email / youremail

And in options tab, check "Always On".
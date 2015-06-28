@echo off
setlocal

set VCAP_SERVICES={"mongolab" : [ {"name" : "MongoLab-3c","label" : "mongolab","plan" : "sandbox","credentials" : {"uri" : "mongodb://IbmCloud_hsisgp6l_gr2r4anp_31jh0fp9:92ceKU6S38oTNh4guxTzeSHxvtgzV3hE@ds055200.mongolab.com:55200/IbmCloud_hsisgp6l_gr2r4anp"}}]}

node querytest.js

endlocal


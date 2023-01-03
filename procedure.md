login procedure

- https get qrcode
  - test API with cmd curl
    <br>sample response in JSON
    <br>
    {
    "code": 0,
    "message": "0",
    "ttl": 1,
    "data": {
    "url": "https://passport.bilibili.com/h5-app/passport/login/scan?navhide=1\u0026qrcode_key=588019573cd20bb91a052bde37353b8b\u0026from=",
    "qrcode_key": "588019573cd20bb91a052bde37353b8b"
    }
    }
  - use node.js to send https request
- generate qrcode with npm package
  - use node package qrcode-terminal to print qrcode in console directly
- scan with phone
- send login request
  - node.js https request. need to carry a cookie

search uploader videos
get list
filter videos within one year

download audio
or download video then extract audio
use pattern matching to find keywords

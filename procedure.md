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

- get list
  - {
    code: -401,
    message: '非法访问',
    ttl: 1,
    data: {
    ga_data: {
    decisions: [Array],
    risk_level: 1,
    grisk_id: 'daa3e0060d0c749c28e34bce379b74a3',
    decision_ctx: [Object]
    }
    }
    must add referer and valid user-agent. otherwise -401
    }
- filter videos within one year
  - try 7 days and 30 days first
  - need to check bilibili time is UTC+8 or UTC+0, since 1970-01-01
  - SyntaxError: Unexpected end of JSON input. I don't know why
    - solution: https://stackoverflow.com/questions/62480360/error-syntaxerror-unexpected-end-of-json-input
  - how to automatically execute another js file after current file ends?

get audio

- get cid by bvid/aid
- get dash audio url by cid
- download using https GET + createWriteStream

post comments in top video

- get aid of the top video. currently replace with my own video for testing
- { code: -101, message: '账号未登录', ttl: 1 }
- it seems that all APIs that require access_key (APP login token) cannot be used by passing csrf and SESSDATA
  <br>for example: get user info http://app.bilibili.com/x/v2/account/myinfo
  <br>and post comment http://api.bilibili.com/x/v2/reply/add
  - solved: headers.Cookie must be a string or an Array of strings, instead of a simple object

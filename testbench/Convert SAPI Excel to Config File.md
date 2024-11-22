# How to Convert  SAPI Excel to Config File

*Released by* [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team` <a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a>

## 1. Overview

The single API file (*SAPI*) from SW team is excel formated(*"\*.xlsx"*), which need to be converted to SAPI config file format(*"\*.json"*) for Unified Tuner use purpose.

## 2. How to Convert

#### Step 1

*   Open SAPI file(e.g. *"xxx.xlsx"*) by excel editor, like Libre Office, MS Excel or Notepad++
*   Find out the **`Version`,`TX_NEW`,`RX_NEW`** and **`Debug_Info`** sheets
*   Export out these sheets as *"\*.csv"* format files naming **"xxx\_0.csv"，"xxx\_1.csv", "xxx\_2.csv", "xxx\_3.csv"**
*   Note：make sure the <font color="Red">*'UTF-8'*</font> coding format used.

#### Step 2

*   Put these *"\*.csv"* files in the same directory as "parser.py"
*   Execute converting in a terminal by command：*`python parser.py xxx`*
*   Two config files, **platforms.json** and **unified-api.json**, will be generated

#### Step 3

*   Put config files to the "./API/SAPI/`a.b.c`/" of Unified Tuner
*   The `a.b.c` is the SAPI version number

## 3. Error FAQ

The parser might hit some error during converting, usually caused by illegal format or typo in the *"\*.xlsx"* file. Such as:

*   The Category name string includes illegal characters, should use ` ` or `_` instead of `'/'` or `'\'` <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB1f622eae9f38b4157c6280d3dd080fd4?method=download&shareKey=18bede8ef723efce8223084aea585493" width="600" /></center>
*   Parameter value string include illegal characters or vlaue exceed `16 bit int` range. <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB870e8a85c013bbb0596a5c7d9f54414f?method=download&shareKey=b1bd339724f0d9ed3dfa793c7516e6ea" width="600" /></center>
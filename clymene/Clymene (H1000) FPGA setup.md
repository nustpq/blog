# Clymene (H1000) FPGA验证硬件连接设置

`2024/09/02` `10:49` *Released by* `PQ` [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team` <a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a> 

## 1. Overview

This is a guide on how to setup Clymeme FPGA verification platform based on DE1-Nano Dev Board, FAB02 Board and AP525.

## 2. System Block Diagram
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBe8d72a24eb1950d127697b4aa9a64774?method=download&shareKey=a6da5255e89aba0dd6b10401bf2e58e8" width="800" /> </center>
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB42c0aa25f0a9c4bba4ac20c559bb28f4?method=download&shareKey=36854956d13943beef178d8323d1cd1c" width="800" /> </center>

## 3. DE10-Nano FPGA Dev Board
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBddf534101985e87463e23616e817f311?method=download&shareKey=67fa8669bb5134fd55cec6b0557f6e30" width="800" /> </center>

## 4. FPGA Dev Board上GPIO定义(20240830 Update) 
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB6d152e72a22e8250a81bae8e275a7ee3?method=download&shareKey=a56f49e4bfe29213d1904115600449ab" width="800" /> </center>

## 5. FPGA Dev Board上开关`SW0~SW3`定义
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBf7b2b1e51d507c4bad9e45dcb8f49932?method=download&shareKey=ca82a714c066f00cfa151ade527176d8" width="600" /> </center>

## 6. FAB02 UIF接口说明
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB150a3361e1db4dc0057aa5c3386d2b92?method=download&shareKey=e62f2b76f7fb646fdf585ca891e0eb9e" width="800" /> </center>

## 7. 时钟源选择AP_PDM_CLK(**<font color=Green>SW3 OFF</font>**)时候，需要将 GPIO-0 的 **<font color=Green>PIN 1-2</font>** 短接
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBc4e07cd817ab258906c8d602b2c1964b?method=download&shareKey=2799309eeef114e520d373df5222492b" width="800" /> </center>

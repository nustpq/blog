# Clymene (H1000) FPGA验证硬件连接设置

`2024/09/02` `10:49` *Released by* `PQ` [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team` <a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a> 

## 1. Overview

This is a guide on how to setup Clymeme FPGA verification platform based on DE1-Nano Dev Board, FAB02 Board and AP525.

## 2. System Block Diagram
<center class="half"><img src="./img/clymene_001.png" width="800" /> </center>
<center class="half"><img src="./img/clymene_007.jpg" width="800" /> </center>

## 3. DE10-Nano FPGA Dev Board
<center class="half"><img src="./img/clymene_002.png" width="800" /> </center>

## 4. FPGA Dev Board上GPIO定义(20240830 Update) 
<center class="half"><img src="./img/clymene_003.png" width="800" /> </center>

## 5. FPGA Dev Board上开关`SW0~SW3`定义
<center class="half"><img src="./img/clymene_004.png" width="600" /> </center>

## 6. FAB02 UIF接口说明
<center class="half"><img src="./img/clymene_005.png" width="800" /> </center>

## 7. 时钟源选择AP_PDM_CLK(<font color=Gren>SW3 OFF</font>)时候，需要将<font color=Red> GPIO-0 </font>的 `Pin1-2` 短接
<center class="half"><img src="./img/clymene_006.png" width="800" /> </center>

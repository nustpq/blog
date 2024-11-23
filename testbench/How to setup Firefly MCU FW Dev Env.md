# How to setup Firefly MCU FW Development Environment 

*Released by* [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team` <a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a>

## Overview

This is a guide on how to setup hardware and software tool envirenment for Firefly MCU FW development.

## Hardware Connection

*   Firefly board is powered by USB Micro port (5V1A) 
*   **Firefly Board PCB**
    <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB3df0e1374debd2e0f7c46c502b7c82ae?method=download&shareKey=36b2114743eb8c03e0de41636be57476" width="600" />

*   The ARM J-Link V9 tool is used for MCU JTAG connection via the **J5** port on Firefly board
*   The **SWD mode** is used for JTAG interface, which includes 4 pins :  <font color=Red>**VDDIO, SWDIO, SWCLK, GND**</font>
*   **Firefly Board JTAG**
    <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB0c7da00b0709500861bd89b3fe157642?method=download&shareKey=8588333df5e02dee5526436b1528e25d" alt="Schematic" width="400" /> </center>
*   **ARM J-Link V9 JTAG Connector**
    <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBbf601a0ce19dc9c68f464494ae0d1a57?method=download&shareKey=192a533ec93546dc7cb75ac518c4fac3" width="600" />
## Software Tool

*   Install [IAR EW for ARM](https://fortemediainc-my.sharepoint.com/:f:/g/personal/qiangp_fortemedia_com/EnFT0cYZIcVHly_NALLWa_8BVJ5ZrfBrQgTH5GkGhZRTVg?e=H8lhrR).
*   Install [J-Flash V7](https://fortemediainc-my.sharepoint.com/:u:/g/personal/qiangp_fortemedia_com/Ec6OxHSkyEZKlNZrmRtYqLkBzqli39bh7SUI2Q6VyWd0HQ?e=JCjD7E) install in the default directory.
*   Clone Firefly MCU Source Code from Bitbucket
    ```
    git clone git@bitbucket.org:teamfortemedia/firefly.git
    ```
*   Start project in the IAR by opening the Firefly workspace file
    <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBe1b07b19dcde65f37c5352f796528bb1?method=download&shareKey=d04177feb72b8f6c232f261fb276426a" width="600" />
    <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBf246558ea056a6cb3f05666c8b943e7c?method=download&shareKey=11b23886ae5ba7638612b5696a97cd2b" width="600" />

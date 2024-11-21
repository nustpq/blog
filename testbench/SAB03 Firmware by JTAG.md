# How to Update SAB03 Firmware by JTAG (readme)

*Released by* [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team` <a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a>

## Overview

This is a guide on how to update SAB03 MCU(STM32F723) firmware by JTAG interface when firmware auto updating function is not working in some case.

## Hardware Connection

*   The ARM J-Link V9 tool is used for MCU JTAG connection via the **J5** port on SAB03 board
*   The **SWD mode** is used for JTAG interface, which includes 4 pins :  <font color=Red>**VDDIO, SWDIO, SWCLK, GND**</font>
*   **SAB03 Board Schematic**
    <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB0c7da00b0709500861bd89b3fe157642?method=download&shareKey=8588333df5e02dee5526436b1528e25d" alt="Schematic" width="400" /> </center>
*   **SAB03 Board PCB**
    <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB60317751dc5e97a5c527657f2845ad50?method=download&shareKey=a09d293d1f943afb39e32f498683eea6" width="600" />
*   **ARM J-Link V9 Connector**
    <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBbf601a0ce19dc9c68f464494ae0d1a57?method=download&shareKey=192a533ec93546dc7cb75ac518c4fac3" width="600" />

## Software Tool

*   Make sure the [J-Flash V6.20f](https://fortemediainc.sharepoint.com/\:u:/s/live_doc/products/EXBjdRiIZtRPhwy52B-GJEQBbpW3Yi8sORMyyZyuQZJo7w?e=gQivdc) have been installed in the default directory.
*   Download the [SAB03\_DOWN\_TOOL](https://fortemediainc.sharepoint.com/\:u:/s/live_doc/products/Ecm1kz2DDFNJqS_g5CW4yhcBwT1a5m1Ahr5gyWgvdBl_Jg?e=CDzmzK), unzip it and execute the **"Run\_v6.20f.bat"** to start firmware updating after JTAG connected.


# How to Update FAB02 Firmware by SAM-BA

*Released by* [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team` <a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a> `2022/11/14 13:28`

## 1. Overview

This is a guide on how to update FAB02 MCU(ATSAMA5D2) firmware by [SAM-BA](https://www.microchip.com/en-us/development-tool/SAM-BA-In-system-Programmer) MCU In-system Programmer when firmware auto updating function is not working in some case.

## 2. How to Start

*   Download the FAB02 Board MCU Firmware Updater tool by click [Here](https://link.jscdn.cn/sharepoint/aHR0cHM6Ly9mb3J0ZW1lZGlhaW5jLnNoYXJlcG9pbnQuY29tL3NpdGVzL2lNNjAxQ29yZVRlYW0vU2hhcmVkIERvY3VtZW50cy9Eb2N1bWVudCBNYXAvU1FBXzUwNV9Eb2N1bWVudC9GQUIwMiBGaXJtd2FyZSBSZWxlYXNlL3VwZGF0ZXIvZmFiMDJfZndfdXBkYXRlci43eg.7z)
    *   The **`boot.bin`** is MCU bootloader, and the **`app.bin`** is the application bin file.
    *   You can replace them by new version files before start, remember to **keep name unchanged**.
*   Connect FAB02 USB to PC
*   Execute **`Run.bat`** to start updating and <font color="Red"> **make sure to follow instruction info on terminal step by step** !</font>

## 3. Check Result

#### 3.1 Update Scceeded

*   You can see the following information on terminal if the firmware was updated successfully. And the time cost is about 20 seconds normally.
    ![ok](https://note.youdao.com/yws/api/personal/file/WEB832574e09d39c58d4afbde84a6b3ce0a?method=download\&shareKey=bf5d012cda16af39b068ba532c47d5a4)

#### 3.2 Update Failed

If the execution stopped in a short time and you see some error info on terminal, that means the firmware update was failed.

*   **"Error: No serial ports found"**
    Please check if FAB02 board USB was connected to PC, and if FAB02 **SW20-\[2]** was switched to **\[ON]** side.
    ![error1](https://note.youdao.com/yws/api/personal/file/WEB1028e28863715cc4a4170119a0674070?method=download\&shareKey=0df3cf4c1ab4c1135d1b1550805dc961)

*   **"Error: Could not initialize applet (status: 15)"**
    Please check if FAB02 **SW20-\[2]** was switched back to **\[OFF]** after board restarted.
    ![error2](https://note.youdao.com/yws/api/personal/file/WEBeff0f91a8ba3d4af4ce6784abe83aca2?method=download\&shareKey=8a826cfb3452534789b1f982c859212f)


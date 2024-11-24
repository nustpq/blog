# FM1802麦克风校正工具 - 使用说明

<font color="green">*V1.0*</font> *released by* [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team` <a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a> `2023/03/23 08:46`

## 1. 概述

为保证每个FM1802麦克风模组产品都能达到出色的定向拾音性能，需要使用FM1802麦克风校正工具来保证模组中两个麦克风相位和幅度的一致性。本文介绍了FM1802麦克风校正系统的搭建以及校正工具的使用和注意事项。

## 2 硬件说明

### 2.1 系统连接框图

*   校正工具需要使用Fortemedia的SAB03测试终端来连接PC和待测FM1802麦克风模组。具体连接如下如图所示:
    <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBce2cd5ed19fcc5906b1aeb3333943a7f?method=download&shareKey=350e1c43e3aeea868db8c4cc165f3f4a" width="800"/> </center>

### 2.2 SAB03测试终端

*   SAB03输出信号电平选择开关设置为<font color="red">`3.3V`</font>。
*   SAB03通过USB(Type B)连接测试电脑。
*   SAB03支持Win7及以上系统，在Win10以上系统免安装驱动。
*   SAB03连接电脑后会识别为设备`iSAM Testbench SAB03`和声卡`USB AUDIO CODEC`。
*   SAB03通用DUT口定义如下：<br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB486b1cc0447392e8f4540e74f0d56b99?method=download&shareKey=a60768be41a428ea272df7e7a32328a7" width="400" /> </center>


### 2.3 信号连接说明

*   放音的NE喇叭可以使用SAB03终端自带的声卡（`SPEAKER`音频输出口）输出驱动，也可以使用外接USB声卡来驱动。注意：用于放音的声卡必须要设置为系统<font color="red">默认声卡</font>。
*   SAB03通用DUT接口连接麦克风模组测试点。信号连接说明如下：
<!-- 让表格居中显示的风格 -->
<style>
.centerpq
{
  width: auto;
  display: table;
  margin-left: auto;
  margin-right: auto;
}
</style>

<div class="centerpq">

| Pin   |  SAB03     |  麦克风模组  |
|:---:  | :-------   | :--------- |
| `01`  | FM_SDA     | I2C SDA    |
| `02`  | FM_SCL     | I2C SCL    |
| `09`  | FM_SPI_SDI | I2S TX     |
| `11`  | FM_SPI_CS  | I2S FCLK   |
| `12`  | FM_SPI_SCL | I2S BCLK   |
| `15`  | DUT_GPIO3  | Reset      |
| `17`  | GND        | GND        |
    
</div>


## 3 软件说明

### 3.1 安装

*   解压软件包`aeolus_mic_calibration_tool_V1.zip`后,直接运行`Aeolus_V1.exe`即可启动APP。
*   Win7系统需要安装`\driver\`目录下的驱动，Win10以上则不需要安装。
*   如果系统弹出是否允许`LaoMuJiVC.exe`服务运行提示，选择<font color="red">`是`</font>。 <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB3488cf9ef4b5567af406b32718ed9f4a?method=download&shareKey=35efdd038f3b6e5c028f3f64043bf242" width="400" /></center>

### 3.2 使用

*   打开APP后，如果检测到有SAB03终端设备连接，会显示`硬件已连接`，并且在APP界面左下状态栏显示SAB03的固件版本信息。
*   用户点击右下的`开始`按钮即可启动麦克风校正程序。
*   校正时间大约为5s左右，和测试使用的电脑性能有关。
*   校正结束后在APP界面右上会根据校正结果判断成功或者失败分别显示<font color="green">`PASS`</font>或者<font color="red">`FAIL`</font>。
*   校正过程中出现任何错误，程序会立即停止校正并显示相关错误信息。
*   校正结束后，校正参数会写入麦克风模组的EEPROM中。同时，校正参数以及log会保存在程序数据目录：`c:\Users\{USERNAME}\appdata\Local\Aeolus\`中。
    <br><center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBc34e1b88a0187206b07de4b27f82a275?method=download&shareKey=3cb4727e00e1ff949fa270b00dfb6359" width="800" /> </center>

### 3.3 设置

*   判断校正结果是<font color="green">`PASS`</font>或者<font color="red">`FAIL`</font>的标准，是通过校正后再次录音测算两个麦克风相位及幅度误差来决定的。该误差门限值由程序目录下`\resource\config\Aeolus.json`文件来配置。默认误差值为`0.01`，用户可以根据实际情况修改。
*   麦克风模组的序列号保存在EEPROM中。如果EEPROM中存在序列号信息，APP界面左上会直接显示当前模组的序列号。如果没有检测到序列号信息，APP将会根据在程序数据目录下的序列号配置文件`SN_FILE.txt`生成序列号，并写入EEPROM保存。每完成一次矫正测试，该序列号信息会递增，用户也可根据实际情况修改该文件。


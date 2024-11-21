# ABDaemon Issue Summary

*Released by* [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team` <a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a>
`2022/11/23 10:00`

## 1. "太多同步字(sync word)"错误

### 现象

*   录音报错: "too many sync word"

### 原因

*   某次录音ABDaemon(ABD)生成的同步字是0xFF，而录音刚开始I2S数据全为0xFF的时候，ABDaemon会把数据0xFF也当做同步字

### 解决方案

*   ABD生成的同步字中，除了要剔除**0x00**外，需要剔除**0xFF**

## 2. FAB02上I2S1和I2S2同步模式录音的问题

### 现象

*   FAB02中出现的I2S1和I2S2，48Kx8CHx2B 配置为同步录音时候，发现结果不同步。
*   长时间录音还会出现FAB02的MCU不响应。发现是USB这部分没反应了。
*   在I2S2的保存WAV文件最开始插入不确定长度的数据，导致两路录音文件不同步。
*   该插入的数据内容和sync头有关系：将64B的同步头均匀分不到各个channel的数据中。
*   使用BusHound 检测USB数据，没有发现这个插入的数据。看起来是ABD这边的问题。
*   16k的时候较48k不容易出现，可能16k数据量小，PC来得及处理。

### 测试情况

*   发现FAB02 I2S 使用非DMA USB EP引起的问题
*   而AB04没有问题，因为AB04的I2S1 和I2S2都是USB的DMA端点， FAB02为了加速SPI录音，让SPI占用了DMA通路。
*   把FAB02的I2S1和I2S2的的端点都改为DMA端点, 测试没有问题
*   测试详见Shiwei的测试报告[On Sharepoint](https://fortemediainc.sharepoint.com/\:x:/s/iM601CoreTeam/Ef5erL1WitRForsFShI-GrEBvoS1DoKhkG_L52FDqd8XMA?e=0qNJMh):
    *   发现和PC的操作系统有关
    *   最新Win10 系统很容易复现，不同机器上现象一致
    *   Win10的早期版本上，出现的概率会低一些
    *   而Win7系统没有这些问题

### 解决方案

#### 方案1: 找到根本原因来解决

*   如果两个I2S Node, 如果传输速率有差异的时候，ABD会有什么问题。
*   PC的操作系统为什么有这些不同的表现

#### 方案2: 将所有I2S使用同一组USB 端点来传输数据，这样就不存在多个端点同步的问题。

*   USB端点的带宽应该是够的。48k x 8CH x 4B x 3 = 4608kB. 不过需要测试一下。
*   这样只需要3组端点分别传输： CMD，I2S, SPI
*   MCU和ABD都需要增加将各路I2S数据合并，拆解的动作

#### 方案3: 临时方案，ABD支持动态修改endpoint

*   测试I2S同步的时候，将DMA端点让出来给I2S。F目前的MCU可以支持3路I2S的DMA使用。
*   测试SPI的时候，SPI占用DMA端点
*   AT91SAMA5D 系列MCU只有7个DMA可用：  EP1  \~ EP7
*   ABD可以通过配置文件，来支持EP的动态调整(exe不变，修改cfg文件，重启生效)
*   MCU这边可以通过修改I2S回调函数指针来实现，或者干脆直接更新不同版本的FW来实现


# TestBench Debugger DataEngine(ABDEngine) APIs

*Released by* [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team` <a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a> `2023/01/04 17:23`

>TestBench debugger使用的ABDEngine库 python版本接口说明

## 1. 引用模块

模块名称为: `abdengine`
```python
    import abdengine
```
## 2. 创建对象

一个对象对应一次录音的case。
对象主要用来管理case的属性数据，比如channel数目、sample rate、debug信息等等。内部还维护文件列表、搜索缓存等数据。
```python
    wav = abdengine.open('case name')
    wav = abdengine.create('case name')
```
`case name`是case文件的名字，实际是一个sqlite文件。
`open`用来打开一个已经存在的case；`create`用来打开一个新的case，用于录音。

## 3. 参数属性

| 属性             | 说明              |
| --------------- | --------------- |
| `sample_rate`   | 采样率             |
| `sample_bits`   | 采样位宽            |
| `voice_channel` | 语音通道数           |
| `debug_frame`   | debug信息帧长(采样点数) |

## 4. 数据类型

获取的数据类型，具体是哪种，请UI开发者来定义。

## 5. Debug信号ID定义

每个debug信号都对应有个唯一的ID，用于定位该debug信号在DICT表格中的位置，包含其所在的页编号page id和偏移量offset信息。定义如下：

    ID = INDEX_TAG * 65536 + OFFSET

如`DSP current MIPS `的ID就是0x00010010（65552）

## 6. 方法

### 6.1 <font color=Green>wav.setrecinfo</font>(sample\_rate, sample\_bits, voice\_channel\_num, dbg\_channel\_num, dbg\_frame\_len)

*   参数：
    *   `setrecinfo`用来设置case录音的信息，
    *   `sample_rate`是采样率，
    *   `sample_bits`是采样位数（16/24/32），
    *   `voice_channel_num`为语音通道数目,
    *   `dbg_channel_num`为debug通道数目，总通道数为语音通道数+debug通道数，debug通道必须位于语音通道之后，
    *   `dbg_frame_len`指定一个debug帧相当于语音帧的多少sample。用open打开的wav对象调用此方法无效。
*   返回值：
    *   `true` 执行成功
    *   `false` 执行失败

### 6.2 <font color=Green>wav.feed</font>(data,sample\_num)

*   参数：
    *   `feed`用来向对象中写入数据，
    *   `data`中的数据必须是完整的语音帧。用open打开的wav对象调用此方法无效。
*   返回值：
    *   `true` 执行成功
    *   `false` 执行失败
  
### 6.3 <font color=Green>wav.getvoicedata</font>(zoom\_level, channel, start, \[end])

*   参数：
    *   `getvoicedata`用来获取某个channel的音频数据，
    *   `channel`是channel号，
    *   `zoom_level`用来指定是哪个缩放级别的数据，
    *   `start`标志起始sample,
    *   `end`标识结束sample，如果省略`end`代表读取到最后。
*   返回值：
    *   `wavedata` 返回的wave数据列表
    *   `None` 没有找到相应的结果
  
### 6.4 <font color=Green>wav.getdebugdata</font>(zoom\_level, debug\_id, start, \[end])

*   参数：
    *   `getdebugdata`用来获取某个debug数据，
    *   `zoom_level`用来指定是哪个缩放级别的数据，
    *   `debug_id`指定这个debug数据的ID，
    *   `start`标志起始帧,
    *   `end`标识结束帧，如果省略`end`代表读取到最后。
*   返回值：
    *   `debugdata` 有数据返回
        *   `debugdata[0]` 返回的debug数据列表
        *   `debugdata[1]` 每个数据的宽度(byte)
    *   `None` 没有找到相应的结果
  
### 6.4 <font color=Green>wav.search</font>(debug\_id, op, value, \[start, end])

*   参数：
    *   `search`用来按取值区间获取某个debug数据的范围，
    *   `debug_id`是debug数据的ID，
    *   `start`标志起始frame,
    *   `end`标识结束frame。
    *   `op`为**字符串**，标志比较符号包含：

        |  比较符号  | 说明   |
        | ---- | ---- |
        | `=`  | 等于   |
        | `>`  | 大于   |
        | `>=` | 大于等于 |
        | `<`  | 小于   |
        | `<=` | 小于等于 |
        
    *   `value`标记比较数据。
*   返回值：
    *   `box_list` 返回的查找到的数据块列表
    *   `None` 没有找到相应的结果

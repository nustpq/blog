# Test Bench Lab V3 测试项返回数据包格式说明

*Released by* [`Fortemedia`](https://www.fortemedia.com/ "Listen and sound better. Anywhere!") `SQA Tool Team` <a href="mailto:qiangp@fortemedia.com" title="Email the developer">📫</a> `2024/05/31 13:20`

> TestBench Lab V3中测试项(Test Item)具体执行是在GUI Server中的lua脚本中完成的。执行完成后的结果数据是通过JSON格式的数据包送给GUI显示的。下面是返回数据包格式说明。

## 1. 数据包格式
```json
{
    "ret": "bool",
    "output": 
    {
        "info": "string",
        "result": "bool",
        "data": {},
        "format": 
        {
            "id": "int",  
            "order":[],
            "type":[]
        }        
    }
}
```

## 2. 参数说明

- **`ret`** : 测试项是否成功执行, true/false
- **`output`** :  测试项的返回结果和数据
  - **`info`** :  用于显示消息的字符串
  - **`result`** :  测试项是否通过, true/false
  - **`data`** :  具体返回数据项,有两种格式：
    - 对于`Type I` ：表示只有`1个`通道数据，对象类型 { }
    - 对于`Type II` ：表示只有`n个`通道数据，数组类型 [ ]
  - **`format`** :  定义data中各项目数据的显示格式
    - **`id`** :  data的类型. 包含两种：0 - `Type I`,   1 - `Type II`
    - **`order`** :  data中数据项目在GUI上的显示顺序，名称要和data对象中的KEY一致. 要显示数据单位，就在最后用`(unit)`定义
    - **`type`** :  data中数据项目数据的类型，顺序和`order`中定义的保持一致.包含： 

        |  类型     | 说明         |
        | -------- | ------------ |
        | `str`   | 字符串      |
        | `int`   | 整形           |
        | `float` | 浮点数         |
        | `bool`  | 布尔类型 |
        | `hex`   | 以16进制整数 |
        | `list:<type>` | 列表类型。其中type为list中元素的数据类型 |


## 3. 返回数据实例

### 3.1 返回`Type I`类型的数据
```json
{
    "ret": true,
    "output": {
        "info": "Succeeded",
        "result": true,
        "data": {                                
            "ab_name":"[FAB02]",
            "evm_id":"[NA]",
            "ab_hw_ver":"[HW:V1.0]",
            "fpga_ver":"[0.07-2021.08.240]",
            "evm_hw_ver":"[NA]",
            "ab_fw_ver":"[FW:V0.1.492]",                
        },
        "format": {
            "id": 0,  
            "order":["ab_name","evm_id","ab_hw_ver","fpga_ver","evm_hw_ver","ab_fw_ver"],
            "type":["str","str","str","str","str","str"]
        }
    }
}
```
数据在GUI上显示效果如下：
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB6bb8d329a4237485482f880b0d9d5a47?method=download&shareKey=d4916d9f1161a833fd5a6f92de0d69fa" width="800" /> </center>


### 3.2 返回`Type II`类型的数据
```json
{
    "ret": true,
    "output": {
        "info": "Succeeded",
        "result": true,
        "data": [
            {
                "ch_id": 1,
                "result": true,
                "avg": 4.0,
                "segment": [3.5,4.0,4.5],                                
            },
            {
                "ch_id": 2,
                "result": false,
                "avg": 3.5,
                "segment": [3.0,4.0,3.5],                                
            },
            {
                "ch_id": 3,
                "result": true,
                "avg": 4.5,
                "segment": [4.5,4.5,4.5],                                
            }
            
        ],
        "format": {
            "id": 1,  
            "order":["ch_id","result","avg","segment"],
            "type":["int","bool","float","list:float"]
        }
    }
}

```
数据在GUI上显示效果如下：
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBa7ca4239d1ed23c1f0e8a7c27ed8271f?method=download&shareKey=9646fed968bad840812320ab595e3c2d" width="800" /> </center>

### 3.3 返回`Type II`类型的数据
```json
{
    "ret": true,
    "output": {
        "info": "Succeeded",
        "result": true,
        "data": [
            {
                "name": "C_POST_FLT",
                "index":151,
                "addr": 8989464,
                "core_0": 356845,
                "core_1": 356845,
                "core_2": 356845,
                
            },
            {
                "name": "GAIN_NP",
                "index":152,
                "addr": 8989464,
                "core_0": 557573,
                "core_1": 557573,
                "core_2": 557573,                                
            }
        ],
        "format": {
            "id": 1,  
            "order":["name","index","core_0","core_1","core_2"],
            "type":["str","int","hex","hex","hex"]
        }
    }
}

```
数据在GUI上显示效果如下：
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEBd1b80b73b6e2f576a82c6105bb1f361d?method=download&shareKey=0e64d4cea0324083db560fe23afaec12" width="800" /> </center>


### 3.4 返回`Type II`类型的数据
```json
{
    "ret": true,
    "output": {
        "info": "Succeeded",
        "result": true,
        "data": [
            {
                "ch_id": 1,
                "result": true,
                "avg": -38.2,
                "segment": [-35.0,-40.1,-41.5],                                
            },
            {
                "ch_id": 2,
                "result": true,
                "avg": -35.5,
                "segment": [-31.0,-34.9,-43.3],                                
            },
            {
                "ch_id": 3,
                "result": true,
                "avg": -39.4,
                "segment": [-44.5,-34.5,-40.5],                                
            }
            
        ],
        "format": {
            "id": 1,  
            "order":["ch_id","result","avg(dB)","segment(dB)"],
            "type":["int","bool","float","list:float"]
        }
    }
}

```
数据在GUI上显示效果如下：
<center class="half"><img src="https://note.youdao.com/yws/api/personal/file/WEB5b259d0d471f261db8ca010159aae445?method=download&shareKey=c311228a55b0559d46806be85254b025" width="800" /> </center>

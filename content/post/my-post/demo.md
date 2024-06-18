from pyswmm import Simulation, Nodes, SimulationPreConfig
import time
import numpy as np

# 创建并配置 SimulationPreConfig 对象
sim_conf = SimulationPreConfig()

# Specifying the update parameters
# 参数顺序: Section, Object ID, Parameter Index, New Value, Obj Row Num (optional)
# 在这里可以根据你的需求添加多个参数更新↓
# [SUBAREAS]    不透水区曼宁系数(N-Imperv)、透水区曼宁系数（N-Perv）【0-0.8】、透水区洼蓄量(S-Perv)、不透水区洼蓄量(S-Imperv)【0.05-0.3英寸inch、
# [INFILTRATION]    最大下渗率(MaxRate)【5-100】、最小下渗率(MinRate)【0-5】、渗透衰减常数(Decay)【0-20】、干燥时间(DryTime)【0-10】
# [CONDUITS]    管道曼宁系数(Roughness)【0.01-0.03】

N_Imperv = [i for i in np.arange(0, 0.8, 0.01)]
N_Perv = [i for i in np.arange(0, 0.8, 0.01)]
S_Perv = [i for i in np.arange(0.05, 0.3, 0.01)]
S_Imperv = [i for i in np.arange(0.05, 0.3, 0.01)]
MaxRate = [i for i in np.arange(5, 100, 2)]
MaxRate = [i for i in np.arange(0, 5, 0.5)]
Decay = [i for i in np.arange(0, 20, 2)]
DryTime = [i for i in np.arange(0, 10, 1)]
Roughness = [i for i in np.arange(0.01, 0.03, 0.005)]


import pandas as pd
from pyswmm import Simulation, Nodes, SimulationPreConfig
import numpy as np
from datetime import datetime

# 创建并配置 SimulationPreConfig 对象
sim_conf = SimulationPreConfig()

# 示例参数更新（需要根据需求添加更多参数更新）
sim_conf.add_update_by_token("SUBAREAS", "sub1", 2, 0.1)  # 示例：更新S1的第三个参数为J2
sim_conf.add_update_by_token("INFILTRATION", "sub1", 1, 10)  # 示例：更新时间序列

# 设置输入文件路径
sim_conf.input_file = './kw_03_saved_models/race_model_ts_mod.inp'

# 应用修改并生成新的 inp 文件
modified_inp_path = sim_conf.apply_changes()

# 读取 Excel 文件中的数据
excel_path = './kw_01_data/排水监测站时段报表.xls'
df = pd.read_excel(excel_path, sheet_name='流速', index_col=0)

# 初始化一个空列表来保存模拟的 volume 和 Excel 数据中的平均值
simulated_volumes = []
excel_averages = []

# 使用修改后的 inp 文件运行模拟
with Simulation(modified_inp_path) as sim:
    node_object = Nodes(sim)
    PSK = node_object["PSK"]
    num = 0
    for step in sim:
        num += 1
        cst = step.current_time
        format_cst = f"{cst.year}年{cst.month}月{cst.day}日{cst.hour}时"

        # 检索对应时间的“平均”值
        if format_cst in df.index:
            excel_avg = df.at[format_cst, '平均']
            excel_averages.append(excel_avg)
            simulated_volumes.append(PSK.volume)

        print("=" * 30 + f"step{num}: {format_cst}" + "=" * 30)
        print(f"volume of the PSK: {PSK.volume}")

print("Simulation finished")

# 计算纳什效率系数 (NSE)
simulated_volumes = np.array(simulated_volumes)
excel_averages = np.array(excel_averages)

# NSE 公式
numerator = np.sum((simulated_volumes - excel_averages) ** 2)
denominator = np.sum((excel_averages - np.mean(excel_averages)) ** 2)
NSE = 1 - numerator / denominator

print(f"Nash-Sutcliffe Efficiency (NSE): {NSE}")

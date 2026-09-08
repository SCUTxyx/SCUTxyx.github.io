# RLT

![截屏2026-03-20 14.57.07](/Users/xueyuxuan/Library/Application Support/typora-user-images/截屏2026-03-20 14.57.07.png)

## 想解决的问题

* VLA大模型泛化好，但是一些新的下游任务，尤其是**高精度接触类任务**最后几毫米往往**不够准**。

  * 动作慢。

  * 接触前后会犹豫、探测、退回来再试。

  * 微小误差在关键阶段累积成失败。

  * 纯靠示教数据很难覆盖所有精密接触细节。

    作者认为，RL很适合补这个短板，因为RL可以围绕目标任务反复练习，把优化集中在最关健、最难、最需要精度的阶段。


问题在于：

* 直接对整个VLA模型做Online RL，参数太大、算力太重、样本效率不现实。
* 性能上限：VLA是通过“模仿”学习的。如果人类示范者在遥控时手抖了，或者动作不够丝滑，VLA也就只能学到这种程度。
* 触觉与动力学的缺失：纯视觉的VLA很难理解“阻力”和“卡紧”的感觉。在静谧装配中，很多动作需要靠“摸索”和“扭动”来对准，这是模仿学习极难掌握的。
* 传统小模型RL虽然训练效率高，但又丢掉了VLA的大模型先验。
  * **微调大模型太慢：**传统的RL如果直接用来更新拥有数十亿参数的VLA模型，计算成本极高，且在真实机器人上收集数据的效率极低。
  * 如果撇来大模型，从头训练一个轻量级的RL小模型，虽然训练快，但是完全抛弃了VLA预训练学到的丰富视觉和语义先验知识，泛化能力差。

核心矛盾：

**如何既保留VLA的泛化与先验，又获得小型在线RL的样本效率和快速适配能力？**

## 目的

RLT的目标不是“重新训练一个机器人策略”，而是：

1. **保留预训练VLA的感知和行为先验。**
2. **只用少量真实机器人数据做在线RL。**
3. **重点优化高精度关键阶段。**
4. **通过一个轻量actor-critic快速改进速度和成功率。**

论文给出的总方案是：

* 先把VLA改造成能输出一个适合RL使用的紧凑表征：RL Token。
* 然后冻结VLA，只在RL Token上训练一个小型actor和critic。
* actor不从零做动作，而是围绕VLA的参考动作做refinement。
* 再用正则把策略锚定在VLA周围，避免在线RL发散。

## 创新点：RL Token与分工合作

**RL Token(RLT)：**核心逻辑是**”大模型看全局并给建议，小模型做精细微调“**。

* 引入 RLT(强化学习令牌)：作者没有让RL直接读取VLA庞大复杂的内部特征向量，而是**训练了一个额外的模块**，将VLA的知识“压缩”成一个紧凑的表示形式，这就是RL Token。
  * **Frozen VLA：**保持参数不变，负责提供广阔的视觉感知理解，并给出初步的“参考动作”。
  * **轻量级 Actor-Critic：**接收RL Token，并基于VLA给出的参考动作进行局部修改和优化，专攻任务中最难、最精细的部分。

## Related Work

### VLA

作者先回顾了VLA的发展脉络：

* 通用机器人的发展脉络。
* 两个关键技术：
  * action chunking：一次输出多个动作，开环执行一段。
  * 更强的动作分布建模：如diffusion或autogressive，使其能表达**多模态动作分布**。
* 再往前发展，就是把大视觉语言模型作为backbone，得到VLA，从网络数据和机器人数据里继承先验知识。

但作者指出，VLA的上限仍然受示教数据质量限制。如果任务本身要求亚毫米级精度，而示教数据有噪声、不稳定，那VLA学出来就很难在关键阶段做到真正高性能。

### Real-World RL

论文认可现实机器人上的强化学习这条线已经证明：

* Off-policy actor-critic在实机上是可行的。
* replay buffer提高了样本效率。
* human intervention/demo bootstrap很重要。
* 类似SERL、RL100这类框架已经能在几小时内学会 contact-rich manipulation。

但是作者指出这些方法有一个普遍问题：

* 它们通常训练的是小策略。
* 感知编码器往往只是普通预训练视觉encoder。
* 没有利用现代VLA自带的强行为先验和多模态任务理解能力。

### RL fine-tuning of VLA

第三类是“如何对预训练 VLA 做 RL 微调”。

作者把它又分成两端：

#### 一端：直接更新整个VLA

例如RECAP、PPO-style VLA fine-tuning等，这类方法会直接优化整个大模型。问题是：

* 很重。
* 真实机器人在线RL不够高效。
* 不太适合“几小时内必须见效”的场景。

#### 另一端：冻结大模型，只训练轻量附加模块

比如：

* ConRFT：冻encoder，调action head。
* Policy Decorator：加Residual policy。
* PLD：critic预训练+residual policy。
* DSRL：在diffusion latent/noise space上做RL引导。

### RLT的使命

**既要保留VLA的“通用常识”，又要像轻量级RL模型一样，能在几小时内学会精细动作。**

1. RL Token：从VLA内部抽一个紧凑表示，既保留预训练知识，又集合轻量RL。
2. chunked action：沿用VLA的chunk接口，缩短有效决策horizon。
3. 参考动作条件化+正则：不是预测residual/noise，而是直接围绕VLA给的chunk做局部编辑。



## RLT整体思路

### 大VLA负责什么

* 感知。
* 语言理解。
* 提供参考action chunk。
* 提供紧凑状态表征(RL Token)。

### 小RL模块负责什么

* 只在当前具体任务上做快速在线refinement。
* 学会比VLA更快、更稳、更适合接触的策略。
* 尤其在关键阶段做提升。

### 为什么有效

因为这不是“从零学一个机器人策略”，而是：

**从一个已经不错的VLA行为出发，在其附近做高样本效率的局部优化。**

## 逐个公式讲解

### RL Token定义

$$
z_{rl}=g_{\phi}([z_{1:M},e_{rl}])_{M+1}
$$

* $f(s,l;\theta_{vla})$：预训练VLA输出的最后一层token embeddings。
* $z=f(s,l;\theta_{vla})$。
* $z_{1:M}=\{z_1,...,z_M\}$：VLA的各个输入token对应的embedding。
  * 表示VLA内部原本有一大串特征$z_1,...,z_M$。
  * 可以理解为：
    * 图像里看到了什么。
    * 语言指令说了什么。
    * 当前机器人状态。
  * 这些信息混合在一起，形成很多个token表示。
* $e_{rl}=e_{\phi}(<rl>)$：一个可学习的特殊token embedding，类似一个“读出槽位”。
  * 作用是：**让它去负责收集、浓缩前面所有信息**。
* $[z_{1:M},e_{rl}]$：把RL token拼接到原有token序列后面。
  * 意思是：把原来那一串特征，再加上这个特殊token，一起送进网络。
* $g_\phi$：轻量encoder transformer。
* $[z_{1:M},e_{rl}]$：把RL Token拼接到原有token序列后面。
* $(\cdot)_{M+1}$：取encoder输出序列中最后这个special token的位置。
* $z_{rl}$：最终得到的RL Token。

#### 直观解释

这一步的本质是在做：**给VLA的内部表征加一个可学习读头，让它自己总结出一个适合RL的紧凑状态向量**。

### 重构损失$L_{ro}$

$$
L_{ro} = \mathbb{E}_D \left[ \sum_{i=1}^M \left\| h_\phi(d_\phi([z_{rl}, \bar{z}_{1:i-1}]))_i - \bar{z}_i \right\|^2 \right]
$$

* $D$：任务演示数据集。
* $d_\phi$：decoder transformer。
* $h_\phi$：线性输出投影。
* $\bar{z_i}=sg(z_i)$：对原始VLA embedding做stop-gradient后得到的目标。
* $[z_{rl},\bar{z}_{1:i-1}]$：自回归输入，利用RL token和之前token来预测当前token。
* $||\cdot||^2$：平方误差。

#### 这一步作用

让RL token承担一个“信息瓶颈”的角色：

* encoder必须把VLA的关键信息压进$z_{rl}$。
* decoder再从$z_{rl}$尽可能重构原始embedding序列。

### 训练RL token的联合目标

$$
\phi,\theta_{vla}=argmin_{\phi,\theta_{vla}}L_{ro}(\phi)+\alpha L_{vla}(\theta_{vla})
$$

* $L_{ro}$：训练RL token的重构目标。
* $L_{vla}$：VLA的监督微调损失。
* $\alpha$：控制VLA微调项权重的系数。

#### 含义

作者并不是只训练RL token，也允许同时做少量task-specific VLA fine-tuning。这样可以：

* 先把base VLA稍微适配目标任务。
* 同时学到适用于该任务的RL token。

之后：

* $\theta_{vla}$冻结。
* $\phi$也冻结。
* 在线RL只训练actor/critic。

### critic损失$L_Q$

$$
L_Q = \mathbb{E}_{(x, a_{1:C}, x') \sim B} \left[ \left( \hat{Q} - Q_{\psi}(x, a_{1:C}) \right)^2 \right]
$$

其中target为：
$$
\hat{Q} = \sum_{t'=1}^{C} \gamma^{t'-1} r_{t'} + \gamma^C \mathbb{E}_{a' \sim \pi_\theta} \left[ Q_{\psi'}(x', a') \right]
$$

​	$x=(z_{rl}, s^p)$：RL 状态，由 RL token 和额外本体状态组成

* $B$：replay buffer

* $Q_\psi$：critic

* $Q_{\psi'}$：target critic

* $a_{1:C}$：当前 chunk 动作

* $x'$：下一个状态

* $a' \sim \pi_\theta$：从当前 actor 采样下一个 chunk

* $\gamma$：折扣因子

* $r_{t'}$：chunk 内每个 step 的奖励

#### 为什么 chunk critic 合理

因为任务是长时程稀疏奖励，单步动作很难知道自己对最终成功贡献多大。把多个动作打包成chunk后：

* 有效horizon变短。
* TD backup更容易传递成功信号
* 更适合高频控制和实机稀疏奖励。

### actor 分布

$$
\pi_\theta(a_{1:C} \mid x, \tilde{a}_{1:C}) = \mathcal{N}(\mu_\theta(x, \tilde{a}_{1:C}), \sigma^2 I)
$$

* $a_{1:C}$：RL actor 生成的动作 chunk

* $x=(z_{rl}, s^p)$：输入状态

* $\tilde a_{1:C}$：VLA 给出的参考 action chunk

* $\mu_\theta(\cdot)$：actor 输出的均值

* $\sigma^2 I$：固定协方差高斯噪声

**actor的输入不只是状态$x$，还包括VLA给出的参考动作chunk。**

这意味着RL actor不是从零凭空规划，而是学会：“在VLA原建议的基础上，怎么改得更好”。

### actor 损失$L_\pi$

$$
L_{\pi}(\theta) = \mathbb{E}_{s \sim B, a_{1:C} \sim \pi_{\theta}} \left[ -Q_{\psi}(x, a_{1:C}) + \beta \|a_{1:C} - \tilde{a}_{1:C}\|_2^2 \right], \quad \tilde{a}_{1:C} \sim \pi_{vla}(\cdot | s, \ell)
$$

**第一项：$-Q_\psi(x,a_{1:C})$**

最小化它，等驾驭最大化critic预测值。

* 意思是：学那些能提高成功率/效率的动作chunk。

**第二项：$\beta||a_{1:C}-\tilde{a}_{1:C}||^2_2$**

这是一个行为约束项，让actor不要离VLA的参考动作太远。

参数$\beta$的作用：

* $\beta$大：更保守，更贴近VLA。
* $\beta$小：更敢探索，但刚容易偏离好先验、训练不稳。

$\beta$控制actor向VLA参考动作靠拢的强度。



## 方法与技术细节

![截屏2026-04-07 09.36.33](/Users/xueyuxuan/Library/Application Support/typora-user-images/截屏2026-04-07 09.36.33.png)

主要分为两个阶段：

### 阶段一：提取RL Token

作者在预训练的VLA内部加上了一个小型的**Transformer编码器-解码器结构**：

* **注入特殊Token：**在VLA处理图像和指令生成的特征序列末尾，加入一个可学习的$e_{rl}$。
* **信息瓶颈压缩(The Bottleneck)：**通过一个轻量级Transformer解码器，将所有特征压缩到这个$z_{rl}$(RL Token)中。
* **重构监督：**为了保证这个Token不丢失关键信息，作者强迫解码器必须能根据这个Token还原出原始的VLA特征。这样，RL Toekn就成为了VLA知识的高保真浓缩版。
* **冻结基座：**一旦学好了这个提取器，VLA和提取器就锁死了(Frozen)，不再消耗算力。

### 阶段二：在线强化学习微调

在提取出RL Token后，VLA和Token提取模块的参数就被彻底“冻结”了。接下来训练小型的**Actor**和**Critic**。

* **状态输入：**Actor和Critic的输入是**RL Token**加上**机器人的本体感受数据(比如关节位置)**：机器人以50Hz的频率运行，如果RL每次只预测一步动作，奖励信号会极其稀疏，导致无法收敛。因此，RL策略会一次性输出一个动作块。

* **行为克隆正则化(BC Regularizer)：**为了防止RL像无头苍蝇一样乱试，Actor的输入会包含VLA给出的”参考动作块“$ \tilde{a}_{1:C}$。在损失函数中，作者加入了一个惩罚项$\beta||  a_{1:C}-\tilde{a}_{1:C}||^2_2$，强迫RL输出的动作不能偏离VLA的建议太远。这把漫无目的的全局搜索，变成了高效的人局部精修。

  如果一直给参考动作，Actor可能会偷懒，直接复制VLA的动作而不去学习改进。所以作者在训练时会随机把参考动作设为0，逼迫Actor自己也具备生成动作的能力。
  
* **动作块训练：**Actor和Critic都以“块”为单位进行学习和评分，这解决了高频控制下的奖励稀疏问题。

### 阶段三：人类干预和关键阶段切换

为了实战的高效，作者采用了**“局部切入”**策略：

* **分段执行：**任务开始时，由基础VLA负责简单的抓去和移动。当进入需要精度的“关键阶段”，控制权瞬间切换给RL 策略。
* **人类干预：**如果RL表现不好，人类操作员可以直接接管。这些干预数据会存入回放池，成为RL的“良师益友”，帮助它快速脱离错误状态。

## 实验

为了证明RLT真的能在现实中起作用，作者在真实机器人上测试了4个需要亚毫米级精度的任务：**拧螺丝、扎带固定、插网线、插充电器**。他们主要针对任务中最困难的“关键阶段”进行RL强化。

* **性能飞跃(Q1)：**在几个小时甚至几十分钟的在线训练后，RLT在最困难的阶段将执行速度提升了最高3倍。成功率也大幅提升，例如高难度的“拧螺丝”任务从基础VLA的20%成功率提升到了65%。
* **r有基线(Q2)：**相比于只做单步预测的HIL-SERL和PLD，RLT因为使用了动作块(Action Chunks)而表现出压倒性优势。相比于DSRL和直接做模仿学习的DAgger，RLT在保持高成功率的同时，大幅缩短了任务完成时间(吞吐量提升显著)。
* **消融实验(Q3-每个组件都有用吗)：**
  * **去掉RL Token(换成普通的ResNet)：**吞吐量下降50%，说明RL Token确实包含了对机械操作至关重要的结构化特征。
  * **去掉动作块：**退化为单步从做，基本无法稳定超越基础模型。
  * **去掉正则化：**性能下降最惨烈，说明没有大模型的动作约束，小模型很难在复杂的连续空间中找到正确解。
* **涌现更优策略(Q4)：**在“插网线”任务中，人类示范和基础VLA经常表现出“试探、后退、再试探”的犹豫动作。而RLT经过探索，学会了直接推入，如果卡住就稍微扭动的策略，其速度甚至超越了人类专家遥控的平均速度。


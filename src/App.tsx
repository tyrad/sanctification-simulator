import { useState, useEffect, useMemo } from 'react';

// 类型定义
type PathKey = 'A' | 'B' | 'C' | 'D' | 'E';
type ClassName = '野蛮人' | '游侠' | '圣骑士' | '法师' | '德鲁伊' | '魂灵师';

interface PathData {
  stage: number;
  paths: Record<PathKey, string>;
  costs: { stone: number; gold: number };
}

interface Settings {
  selectedClass: ClassName;
  startStage: number;
  batchCount: number;
  targetPaths: PathKey[][];
  blockedPaths: PathKey[][];
  allowedImperfectEntries: number;
}

interface SimulationResult {
  type: 'single' | 'batch';
  data?: {
    success: boolean;
    path: Array<{
      stage: number;
      pathKey: PathKey;
      pathName: string;
      costStone: number;
      costGold: number;
      isTarget: boolean;
    }>;
    totalStone: number;
    totalGold: number;
    attempts: number;
  };
  totalRuns?: number;
  successCount?: number;
  avgStone?: number;
  avgGold?: number;
}

export default function App() {
  const pathData: Record<ClassName, PathData[]> = {
    '野蛮人': [
      { stage: 1, paths: { A: '暴戾\n暴击率增加20%', B: '追逐者\n所有【追加】词缀生效时会触发2次', C: '电击迸溅\n电击伤害范围增加25%，并提高90%伤害', D: '旋转旋风\n连转伤害提高50%，撕裂触发期间会发射刀锋，造成400%旋风斩伤害', E: '碎石连击\n碎石伤害提高90%，并会额外向前释放1次' }, costs: { stone: 1, gold: 50 } },
      { stage: 2, paths: { A: '内耗\n每秒损失 8%当前生命，获得 70% 伤害减免', B: '埋怨\n每秒获得1层怒意，每层怒意提高 0.5% 伤害加成，最多叠加150层', C: '电击强击\n"电击"伤客提高100%', D: '连转强击\n"连转"伤書提高120%', E: '碎石强击\n"碎石"伤害提高200%' }, costs: { stone: 3, gold: 50 } },
      { stage: 3, paths: { A: '穿刺\n主动技能造成伤害时使敌人流血，每秒造成1500%攻击的物理伤害，持续3秒', B: '仿制护符\n击败敌人时有15%几率使其爆炸，对敌人造成其20%最大生命的真实伤害', C: '电击进溅\n电击伤害范围增大25%，并提高90%伤害', D: '连转迅击\n"连转"伤害频率提高50％，并提高100%伤害', E: '碎石连击\n"碎石"伤害提高：90%，并会额外向前释放1次' }, costs: { stone: 6, gold: 50 } },
      { stage: 4, paths: { A: '初级秘诀\n终极技能的冷却时间缩短50%', B: '风场\n每4秒召唤风场，进入获得15％移速，敌人进入风场测少5% 移速', C: '电击强击\n电击伤害提高100%', D: '连转猛击\n"连转"伤害提高150％', E: '碎石强击-"碎石"伤套提高200%' }, costs: { stone: 10, gold: 50 } },
      { stage: 5, paths: { A: '无双\n对非首领敌人的伤害提高50%', B: '巨人杀手\n对首领的伤害提高50%', C: '电击斩首\n电击对首领的伤害提高150%', D: '连转斩首\n连转对首领的伤害提高180%', E: '碎石斩首\n碎石对首领的伤害提高250%' }, costs: { stone: 10, gold: 50 } },
    ],
    '游侠': [
      { stage: 1, paths: { A: '暴戾\n暴击率增加20%', B: '傲慢\n获得 20% 冷却缩减', C: '冰箭冰环\n冰箭 伤害提高 110%, 击中的敌人死亡时产生冰环, 冰冻敌人3秒', D: '火箭塔\n火力覆盖伤害提高50% 并会召唤箭塔, 造成6次 100% 多重射击伤害, 箭塔最多存在2台', E: '疾风迅击\n疾风风暴发射频率提高60%, 伤害提高50%' }, costs: { stone: 1, gold: 50 } },
      { stage: 2, paths: { A: '初级秘诀\n终极技能的冷却时间缩短50%', B: '微风\n击败敌人时产生一个吸附敌人的漩涡，冷却3秒', C: '冰箭强击\n冰箭伤害提高 200%', D: '火箭重击\n火力覆盖 暴击造成的伤害提高 210%', E: '疾风强击\n疾风伤害提高 80%' }, costs: { stone: 3, gold: 50 } },
      { stage: 3, paths: { A: '追逐者\n所有【追加】词缀生效时会触发 2 次', B: '埋怨\n每秒获得 1 层怒意，每层怒意提高 0.5% 伤害加成，最多叠加 150 层', C: '冰箭致残\n冰箭 伤害提高 130%，冰环会弱化敌人 3 秒，使其受到的伤害提高 80%', D: '火箭加码\n火力覆盖 伤害提高 200%', E: '疾风迅击' }, costs: { stone: 6, gold: 50 } },
      { stage: 4, paths: { A: '火药陷阱\n每秒丢下一个陷阱，陷阱在2秒后爆炸造成3000%攻击的火焰伤害，并使敌人在3秒内受到的伤害提高60%', B: '教条主义\n原地不动时获得逐渐提高的伤害加成，最高获得50%，移动后失去此效果', C: '冰箭强击\n冰箭伤害提高240%', D: '火箭加码\n火力覆盖伤害提高 200%', E: '疾风强击\n疾风伤害提高 80%' }, costs: { stone: 10, gold: 50 } },
      { stage: 5, paths: { A: '无双\n对非首领敌人的伤害提高50%', B: '巨人杀手\n对首领的伤害提高50%', C: '冰箭斩首\n冰箭 对首领的伤害提高 250%', D: '火箭斩首\n火力覆盖 对首领的伤害提高250%', E: '疾风斩首\n疾风 对首领的伤害提高200%' }, costs: { stone: 10, gold: 50 } },
    ],
    '圣骑士': [
      { stage: 1, paths: { A: '暴戾\n暴击率增加20%', B: '初级秘诀\n终极技能的冷却时间缩短50%', C: '殉道迅至\n殉道 触发爆炸需要的攻击次数减少1次,并提高50%伤害', D: '疾电连击\n疾电 额外投掷1个锤子,并提高20%伤害', E: '净罪追击\n净罪 会追逐敌人,并且伤害提高100%' }, costs: { stone: 1, gold: 50 } },
      { stage: 2, paths: { A: '傲慢\n获得 20% 冷却缩减', B: '风场\n每隔4秒召唤风场,进入获得15%移速,敌人进入风场减少5%移速', C: '殉道沉击\n殉道 基础攻速降低40%,但伤害提高 200%', D: '疾电环流\n疾电 伤害提高60%,并在击败敌人时恢复5点能量', E: '净罪凌弱\n净罪 对低生命敌人造成的伤害最多提高到500%' }, costs: { stone: 3, gold: 50 } },
      { stage: 3, paths: { A: '仿制护符\n击败敌人时有15%概率使其爆炸,对周围敌人造成其20%最大生命的真实伤害', B: '埋怨\n每秒获得1层怒意,每层怒意提高0.5%伤害加成,最多叠加150层', C: '殉道重击\n殉道 暴击造成的伤害提高120%', D: '疾电加护\n疾电 暴击造成的伤害提高80%', E: '净罪重击\n净罪 暴击造成的伤害提高120%' }, costs: { stone: 6, gold: 50 } },
      { stage: 4, paths: { A: '火约陷阱\n每秒丢下一个陷阱,陷阱在2秒后爆炸造成3000%攻击的火焰伤害,并使敌人在3秒内受到的伤害提高60%', B: '诚实硬币\n每隔3秒或击败精英敌人时,在3秒内提高20%或60%伤害加成', C: '殉道强击\n殉道 伤害提高80%', D: '疾电强击\n疾电 伤害提高80%', E: '净罪强击\n净罪 伤害提高150%' }, costs: { stone: 10, gold: 50 } },
      { stage: 5, paths: { A: '无双\n对非首领敌人的伤害提高50%', B: '巨人杀手\n对首领的伤害提高50%', C: '殉道斩首\n殉道 对首领的伤害提高 200%', D: '疾电斩首\n疾电 对首领的伤害提高 150%', E: '净罪斩首\n净罪 对首领的伤害提高200%' }, costs: { stone: 10, gold: 50 } },
    ],
    '法师': [
      { stage: 1, paths: { A: '暴戾\n暴击率增加20%', B: '指引者\n所有【引线】词缀生效时会触发2次', C: '电矛迸溅\n电矛将在随机位置发射，数量增加2个并提高50%伤害', D: '聚光引爆\n每命中同一非首领敌人30次会爆炸，造成500%激光伤害', E: '吞星连击\n吞星在爆炸时会爆炸2次，伤害提高30%' }, costs: { stone: 1, gold: 50 } },
      { stage: 2, paths: { A: '初级秘诀\n终极技能的冷却时间缩短50%', B: '埋怨\n每秒获得1层怒意，每层怒意提高0.5%伤害加成，最多叠加150层', C: '电矛强击\n电矛伤害提高80%', D: '聚光重击\n聚光暴击时造成的伤害提高200%', E: '吞星瞬转\n吞星冷却缩短50%，施法动作加快100%' }, costs: { stone: 3, gold: 50 } },
      { stage: 3, paths: { A: '教条主义\n原地不动时获得逐渐提高的伤害加成，最高获得50%，移动后失去此效果', B: '仿制护符\n击败敌人时有15%概率使其爆炸，对周围敌人造成其20%最大生命的真实伤害', C: '电矛散射\n电矛数量增加2个，并提高50%伤害', D: '聚光斩首\n聚光每命中首领80次会爆炸，造成500%激光伤害', E: '吞星重击' }, costs: { stone: 6, gold: 50 } },
      { stage: 4, paths: { A: '微风\n击败敌人时产生一个吸附敌人的漩涡，冷却3秒', B: '火药陷阱\n每秒丢下一个陷阱，陷阱在2秒后爆炸造成3000%攻击的火焰伤害，并使敌人在3秒内受到的伤害提高60%', C: '电矛清场\n电矛对非首领敌人的伤害提高200%', D: '聚光强击\n聚光伤害提高150%', E: '吞星强击\n吞星造成的伤害提高80%' }, costs: { stone: 10, gold: 50 } },
      { stage: 5, paths: { A: '无双\n对非首领敌人的伤害提高50%', B: '巨人杀手\n对首领的伤害提高50%', C: '电矛重击\n电矛暴击造成的伤害提高120%', D: '聚光清场\n聚光对非首领敌人的伤害提高100%', E: '吞星清障\n吞星对非首领敌人造成的伤害提高120%' }, costs: { stone: 10, gold: 50 } },
    ],
    '德鲁伊': [
      { stage: 1, paths: { A: '暴戾\n暴击率增加20%', B: '初级秘诀\n终极技能的冷却时间缩短50%', C: '集群扩张\n蚀魂毒杖使甲虫爆炸的范围增大,并且甲虫伤害提高170%', D: '重影群击\n重影增加2个狼影,并提高80%伤害', E: '地陷连击\n地陷额外发射1道震荡波,并提高50%伤害' }, costs: { stone: 1, gold: 50 } },
      { stage: 2, paths: { A: '指引者\n所有【引线】词缀生效时会触发2次', B: '风场\n每隔4秒召唤风场,进入获得15%移速,敌人进入风场减少5%移速', C: '集群迅捷\n集群甲虫移速提高30%,伤害提高100%', D: '重影旋风\n重影攻击时有25%概率触发风旋,并提高170%伤害', E: '地陷强击\n地陷伤害提高80%' }, costs: { stone: 3, gold: 50 } },
      { stage: 3, paths: { A: '仿制护符\n击败敌人时有15%概率使其爆炸，对周围敌人造成其20%最大生命的真实伤害', B: '埋怨\n每秒获得1层怒意，每层怒意提高0.5%伤害加成，最多叠加150层', C: '集群轰炸\n集群 甲虫伤害提高100%', D: '重影群击\n重影 增加2个狼影，并提高80%伤害', E: '地陷连击\n地陷 额外发射1道震荡波，并提高50%伤害' }, costs: { stone: 6, gold: 50 } },
      { stage: 4, paths: { A: '火药陷阱\n每秒丢下一个陷阱，陷阱在2秒后爆炸造成3000%攻击的火焰伤害，并使敌人在3秒内受到的伤害提高60%', B: '内耗\n每秒损失8%当前生命，获得70%伤害减免', C: '集群斩首\n集群 甲虫对首领的伤害提高200%', D: '重影强击\n重影 伤害提高150%', E: '地陷重击\n地陷 暴击造成的伤害提高120%' }, costs: { stone: 10, gold: 50 } },
      { stage: 5, paths: { A: '无双\n对非首领敌人的伤害提高50%', B: '巨人杀手\n对首领的伤害提高 50%', C: '集群强击\n集群 甲虫伤害提高 170%', D: '重影斩首\n重影 对首领的伤害提高200%', E: '地陷斩首\n地陷 对首领的伤害提高150%' }, costs: { stone: 10, gold: 50 } },
    ],
    '魂灵师': [
      { stage: 1, paths: { A: '暴戾\n暴击率增加20%', B: '初级秘诀\n终极技能的冷却时间缩短50%', C: '挽歌追击\n挽歌会持续追踪敌人，并且伤害提高50%', D: '骨魔融合\n割肉每2个骨魔会合体为骨魔领主，体型增大并提高140%攻击', E: '回响瞬转\n回响施法动作加快100%，并且冷却缩短50%' }, costs: { stone: 1, gold: 50 } },
      { stage: 2, paths: { A: '傲慢\n获得20%冷却缩减', B: '风场\n每隔4秒召唤风场，进入获得15%移速，敌人进入风场减少5%移速', C: '挽歌迅击\n挽歌飞行速度提高50%，并且伤害提高70%', D: '骨魔迅捷\n割肉骨魔移速提高50%，伤害提高100%', E: '回响唤骸\n回响会在目标处额外产生3具亡骸，并提高80%伤害' }, costs: { stone: 3, gold: 50 } },
      { stage: 3, paths: { A: '仿制护符\n击败敌人时有15%概率使其爆炸，对周围敌人造成其20%最大生命的真实伤害', B: '埋怨\n每秒获得1层怒意，每层怒意提高0.5%伤害加成，最多叠加150层', C: '挽歌强击\n挽歌 伤害提高150%，并在进入战场时获得50%血池', D: '骨魔增加\n割肉 骨魔数量上限增加1个，并提高80%伤害', E: '回响加护\n回响 施法后的5秒内获得40%伤害减免，并提高70%伤害' }, costs: { stone: 6, gold: 50 } },
      { stage: 4, paths: { A: '火药陷阱\n每秒丢下一个陷阱，陷阱在2秒后爆炸造成3000%攻击的火焰伤害，并使敌人在3秒内受到的伤害提高60%', B: '内耗\n每秒损失8% 当前生命，获得70%伤害减免', C: '挽歌重击\n挽歌 暴击造成的伤害提高 70%', D: '骨魔迅击\n割肉 骨魔攻速提高100%，伤害提高 80%', E: '回响强击\n回响 伤害提高130%' }, costs: { stone: 10, gold: 50 } },
      { stage: 5, paths: { A: '无双\n对非首领敌人的伤害提高50%', B: '巨人杀手\n对首领的伤害提高50%', C: '挽歌斩首\n挽歌 对首领的伤害提高200%', D: '骨魔清场\n割肉 骨魔对非首领敌人的伤害提高 200%', E: '回响斩首\n回响 对首领的伤害提高200%' }, costs: { stone: 10, gold: 50 } },
    ],
  };

  const [settings, setSettings] = useState<Settings>({
    selectedClass: '野蛮人',
    startStage: 0,
    batchCount: 100,
    targetPaths: [[], [], [], [], []],
    blockedPaths: [[], [], [], [], []],
    allowedImperfectEntries: 0,
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownPositions, setDropdownPositions] = useState<Record<number, 'bottom' | 'top'>>({});

  const currentClassPaths = useMemo(() => pathData[settings.selectedClass], [settings.selectedClass]);

  const onClassChange = (newClass: ClassName) => {
    setSettings(prev => ({
      ...prev,
      selectedClass: newClass,
      targetPaths: [[], [], [], [], []],
      blockedPaths: [[], [], [], [], []],
    }));
    setResult(null);
  };

  const handleBlockedPathChange = (stageIndex: number, pathKey: PathKey) => {
    const currentBlockedPaths = [...settings.blockedPaths[stageIndex]];
    const targetPathsForStage = settings.targetPaths[stageIndex];

    if (currentBlockedPaths.includes(pathKey)) {
      // Unblock path
      const newBlockedPaths = [...settings.blockedPaths];
      newBlockedPaths[stageIndex] = currentBlockedPaths.filter(p => p !== pathKey);
      setSettings(prev => ({ ...prev, blockedPaths: newBlockedPaths }));
    } else {
      // Block path
      if (currentBlockedPaths.length < 2) {
        const newBlockedPaths = [...settings.blockedPaths];
        newBlockedPaths[stageIndex] = [...currentBlockedPaths, pathKey];

        // If a blocked path was also a target path, unselect it
        const newTargetPaths = [...settings.targetPaths];
        if (targetPathsForStage.includes(pathKey)) {
          newTargetPaths[stageIndex] = targetPathsForStage.filter(p => p !== pathKey);
        }

        setSettings(prev => ({
          ...prev,
          blockedPaths: newBlockedPaths,
          targetPaths: newTargetPaths
        }));
      } else {
        alert('每个阶段最多只能屏蔽两个路径。');
      }
    }
  };

  const toggleDropdown = (index: number) => {
    if (activeDropdown === index) {
      setActiveDropdown(null);
      return;
    }

    // Calculate optimal position for dropdown
    const button = document.querySelector(`[data-dropdown-button="${index}"]`) as HTMLElement;
    if (button) {
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 300; // Approximate dropdown height
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      const position = spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top';
      setDropdownPositions(prev => ({ ...prev, [index]: position }));
    }

    setActiveDropdown(index);
  };

  const getButtonLabel = (index: number) => {
    const targetPaths = settings.targetPaths[index] || [];
    const count = targetPaths.length;
    if (count === 0) {
      return `${index + 1}阶: 任意`;
    } else if (count === 1) {
      const pathKey = targetPaths[0];
      const pathName = currentClassPaths[index]?.paths[pathKey]?.split('\n')[0] || pathKey;
      return `${index + 1}阶: ${pathName}`;
    } else {
      const selectedNames = targetPaths.map(pathKey => {
        return currentClassPaths[index]?.paths[pathKey]?.split('\n')[0] || pathKey;
      });
      return `${index + 1}阶: ${selectedNames.join(', ')}`;
    }
  };

  const handleTargetPathChange = (stageIndex: number, pathKey: PathKey, isChecked: boolean) => {
    const newTargetPaths = [...settings.targetPaths];
    if (isChecked) {
      newTargetPaths[stageIndex] = [...newTargetPaths[stageIndex], pathKey];
    } else {
      newTargetPaths[stageIndex] = newTargetPaths[stageIndex].filter(p => p !== pathKey);
    }
    setSettings(prev => ({ ...prev, targetPaths: newTargetPaths }));
  };

  const _runSimulationOnce = () => {
    let totalStone = 0;
    let totalGold = 0;
    let imperfectCount = 0;
    const pathResult: Array<{
      stage: number;
      pathKey: PathKey;
      pathName: string;
      costStone: number;
      costGold: number;
      isTarget: boolean;
    }> = [];
    const classPaths = currentClassPaths;

    for (let i = settings.startStage; i < 5; i++) {
      const currentStageData = classPaths[i];
      const blockedPathsForStage = settings.blockedPaths[i];
      const availablePathKeys = ['A', 'B', 'C', 'D', 'E'].filter(key => !blockedPathsForStage.includes(key as PathKey));

      if (availablePathKeys.length === 0) {
        // Should not happen if max 2 blocked, but as a safeguard
        imperfectCount = Infinity; // Mark as impossible to succeed
        break;
      }

      const randomIndex = Math.floor(Math.random() * availablePathKeys.length);
      const chosenPathKey = availablePathKeys[randomIndex] as PathKey;
      const chosenPathName = currentStageData.paths[chosenPathKey];
      const targetPathsForStage = settings.targetPaths[i];

      let stoneCostMultiplier = 1;
      let goldCost;

      if (blockedPathsForStage.length === 1) {
        stoneCostMultiplier = 2;
        goldCost = 60;
      } else if (blockedPathsForStage.length === 2) {
        stoneCostMultiplier = 3;
        goldCost = 70;
      } else {
        goldCost = 50;
      }

      const stageStoneCost = currentStageData.costs.stone * stoneCostMultiplier;
      const stageGoldCost = goldCost;

      totalStone += stageStoneCost;
      totalGold += stageGoldCost;

      const isTarget = targetPathsForStage.length === 0 || targetPathsForStage.includes(chosenPathKey);
      pathResult.push({
        stage: i + 1,
        pathKey: chosenPathKey,
        pathName: chosenPathName,
        costStone: stageStoneCost,
        costGold: stageGoldCost,
        isTarget: isTarget,
      });

      if (targetPathsForStage.length > 0 && !targetPathsForStage.includes(chosenPathKey)) {
        imperfectCount++;
        if (imperfectCount > settings.allowedImperfectEntries) {
          break; // Stop further stages for this attempt as it has already failed
        }
      }
    }

    return {
      success: imperfectCount <= settings.allowedImperfectEntries,
      path: pathResult,
      totalStone,
      totalGold,
      imperfectCount,
    };
  };

  const runSingleSimulation = () => {
    let simResult: SimulationResult | null = null;
    let totalAttempts = 0;
    let accumulatedStone = 0;
    let accumulatedGold = 0;

    while (simResult === null || !simResult.data?.success) {
      totalAttempts++;
      const currentAttemptResult = _runSimulationOnce();
      accumulatedStone += currentAttemptResult.totalStone;
      accumulatedGold += currentAttemptResult.totalGold;

      if (currentAttemptResult.success) {
        simResult = {
          type: 'single',
          data: {
            success: true,
            path: currentAttemptResult.path,
            totalStone: currentAttemptResult.totalStone,
            totalGold: currentAttemptResult.totalGold,
            attempts: totalAttempts,
          },
        };
      }
    }

    setResult(simResult);
  };

  const runBatchSimulation = () => {
    let successCount = 0;
    let totalStone = 0;
    let totalGold = 0;
    const runs = settings.batchCount;

    for (let i = 0; i < runs; i++) {
      let simResult: SimulationResult | null = null;
      while (simResult === null || !simResult.data?.success) {
        const currentAttemptResult = _runSimulationOnce();
        totalStone += currentAttemptResult.totalStone;
        totalGold += currentAttemptResult.totalGold;
        if (currentAttemptResult.success) {
          simResult = {
            type: 'batch',
            successCount: successCount + 1,
            avgStone: totalStone / (i + 1),
            avgGold: totalGold / (i + 1),
          };
        }
      }
      successCount++; // Only count as success if a full successful path is found
    }

    setResult({
      type: 'batch',
      totalRuns: runs,
      successCount: successCount,
      avgStone: totalStone / runs,
      avgGold: totalGold / runs,
    });
  };

  const reset = () => {
    setSettings({
      selectedClass: '野蛮人',
      startStage: 0,
      batchCount: 100,
      targetPaths: [[], [], [], [], []],
      blockedPaths: [[], [], [], [], []],
      allowedImperfectEntries: 0,
    });
    setResult(null);
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown !== null) {
        const dropdownElement = document.querySelector(`.relative:nth-child(${activeDropdown + 1})`);
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    };

    if (activeDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  // Handle start stage change
  useEffect(() => {
    setSettings(prev => {
      const newTargetPaths = [...prev.targetPaths];
      for (let i = 0; i < prev.startStage; i++) {
        if (newTargetPaths[i] && newTargetPaths[i].length > 0) {
          newTargetPaths[i] = [];
        }
      }
      return { ...prev, targetPaths: newTargetPaths };
    });
  }, [settings.startStage]);

  return (
    <div className="w-full p-4 sm:p-6 font-sans bg-gray-900 text-gray-300 min-h-screen">
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">《迷雾大陆》圣化模拟器</h1>
        <p className="text-gray-400 mt-2">模拟武器圣化过程与资源消耗</p>
      </header>

      <main className="space-y-6">
        {/* 设置区域 */}
        <section className="bg-gray-800 p-5 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">模拟设置</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="classSelect" className="block text-sm font-medium text-gray-300 mb-1">选择职业</label>
              <select
                id="classSelect"
                value={settings.selectedClass}
                onChange={(e) => onClassChange(e.target.value as ClassName)}
                className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-300"
              >
                {Object.keys(pathData).map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startStage" className="block text-sm font-medium text-gray-300 mb-1">起始阶段</label>
              <select
                id="startStage"
                value={settings.startStage}
                onChange={(e) => setSettings(prev => ({ ...prev, startStage: parseInt(e.target.value) }))}
                className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-300"
              >
                {[0, 1, 2, 3, 4].map(n => (
                  <option key={n} value={n}>{n}阶</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="batchCount" className="block text-sm font-medium text-gray-300 mb-1">批量模拟成功次数</label>
              <input
                type="number"
                id="batchCount"
                value={settings.batchCount}
                onChange={(e) => setSettings(prev => ({ ...prev, batchCount: parseInt(e.target.value) }))}
                min="1"
                max="200"
                className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-300"
              />
            </div>
            <div>
              <label htmlFor="allowedImperfectEntries" className="block text-sm font-medium text-gray-300 mb-1">允许不完美词条数</label>
              <input
                type="number"
                id="allowedImperfectEntries"
                value={settings.allowedImperfectEntries}
                onChange={(e) => setSettings(prev => ({ ...prev, allowedImperfectEntries: parseInt(e.target.value) }))}
                min="0"
                max="5"
                className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-300"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">目标路径 (可多选)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {currentClassPaths.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <button
                    data-dropdown-button={index}
                    onClick={() => toggleDropdown(index)}
                    disabled={index < settings.startStage}
                    className={`w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-300 text-sm text-left ${index < settings.startStage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {getButtonLabel(index)}
                  </button>
                  {activeDropdown === index && (
                    <div className={`absolute z-10 w-64 bg-gray-700 border border-gray-600 rounded-md shadow-lg ${
                      dropdownPositions[index] === 'top' 
                        ? 'bottom-full mb-1' 
                        : 'top-full mt-1'
                    }`}>
                      {Object.entries(stage.paths).map(([key, name]) => (
                        <div key={key} className="p-2 hover:bg-gray-600 flex justify-between items-center">
                          <label className="flex items-center space-x-2 cursor-pointer flex-grow">
                            <input
                              type="checkbox"
                              value={key}
                              checked={(settings.targetPaths[index] || []).includes(key as PathKey)}
                              onChange={(e) => handleTargetPathChange(index, key as PathKey, e.target.checked)}
                              disabled={(settings.blockedPaths[index] || []).includes(key as PathKey)}
                              className="form-checkbox bg-gray-800 border-gray-500 text-blue-500 h-4 w-4 rounded"
                            />
                            <span className={(settings.blockedPaths[index] || []).includes(key as PathKey) ? 'line-through text-gray-400' : ''}>
                              <span className="text-white">{name.split('\n')[0]}</span>
                              {name.split('\n')[1] && (
                                <span className="block text-gray-400 text-xs">{name.split('\n')[1]}</span>
                              )}
                            </span>
                          </label>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBlockedPathChange(index, key as PathKey);
                            }}
                            disabled={(settings.blockedPaths[index] || []).length >= 2 && !(settings.blockedPaths[index] || []).includes(key as PathKey)}
                            className={`ml-2 px-2 py-1 text-xs rounded flex-shrink-0 ${(settings.blockedPaths[index] || []).includes(key as PathKey)
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-gray-500 hover:bg-gray-600 text-white'
                              }`}
                          >
                            {(settings.blockedPaths[index] || []).includes(key as PathKey) ? '已屏蔽' : '屏蔽'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 操作按钮 */}
        <section className="flex flex-wrap justify-center gap-2 sm:gap-4">
          <button
            onClick={runSingleSimulation}
            className="w-full sm:w-auto flex-1 sm:flex-initial px-3 sm:px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            单次模拟
          </button>
          <button
            onClick={runBatchSimulation}
            className="w-full sm:w-auto flex-1 sm:flex-initial px-3 sm:px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 text-sm sm:text-base"
          >
            批量模拟
          </button>
          <button
            onClick={reset}
            className="w-full sm:w-auto flex-1 sm:flex-initial px-3 sm:px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 text-sm sm:text-base"
          >
            重置
          </button>
        </section>

        {/* 结果显示 */}
        {result && (
          <section className="bg-gray-800 p-5 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4 pb-2">模拟结果</h2>
            {/* 批量模拟结果 */}
            {result.type === 'batch' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                  <span className="font-medium">模拟成功次数:</span>
                  <span className="font-mono text-lg text-green-400">{result.successCount} 次</span>
                </div>
                <div className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                  <span className="font-medium">平均圣化石消耗:</span>
                  <span className="font-mono text-lg text-yellow-400">{result.avgStone?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                  <span className="font-medium">平均金币消耗:</span>
                  <span className="font-mono text-lg text-yellow-400">{result.avgGold?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
            )}
            {/* 单次模拟结果 */}
            {result.type === 'single' && (
              <div className="space-y-4">
                <div className="border-t border-gray-700 pt-3 mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">总消耗圣化石:</span>
                    <span className="font-mono text-lg text-yellow-400">{result.data?.totalStone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">总消耗金币:</span>
                    <span className="font-mono text-lg text-yellow-400">{result.data?.totalGold}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-md text-center ${result.data?.success
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
                  }`}>
                  <span className="font-bold text-lg">
                    {result.data?.success ? '达成目标' : '未达成目标'}
                  </span>
                </div>
                <div>
                  {result.data?.path.map((step, stepIndex) => (
                    <div
                      key={stepIndex}
                      className={`mb-2 border-l-4 pl-4 ${step.isTarget ? 'border-green-500' : 'border-red-500'
                        }`}
                    >
                      <p className="font-semibold">{step.stage}阶: {step.pathName}</p>
                      <p className="text-sm text-gray-400">
                        消耗: {step.costStone} 圣化石, {step.costGold} 金币
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

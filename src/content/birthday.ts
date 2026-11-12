// All copy for the card lives here. Address pair is always 大哥 (birthday girl) / 小弟 (sender).

export const intro = {
  titleTop: "宁远一中 2329 班 ·",
  titleMain: "小组内部通知",
  titleTail: "（大学版）",
  lines: [
    { label: "收件人", value: "湖南财经学院 欧阳俞方同学" },
    { label: "寄件人", value: "长沙工业学院 某小弟" },
    { label: "事由", value: "大哥的生日排面，跨校准时送达。" },
  ],
  cta: "大哥，点此签收你的生日排面",
  signed: "签收成功 · 排面已到账",
};

export const archive = {
  title: "2329班小组档案",
  hint: "点纸条翻面，再点翻回",
  cards: [
    { front: "小组日常", back: "大哥坐镇，小弟说笑，老师一回头，全员静音。" },
    {
      front: "经典场面",
      back: "某次讨论跑题，大哥一句话把全组带偏，最后大家一起笑到停不下来。",
    },
    { front: "小弟评语", back: "人狠话不多，笑点最低；嘴上嫌弃，关键时刻最靠谱。" },
    { front: "后来", back: "2329班散了，小组群可能安静了，但大哥的生日排面不能少。" },
    {
      front: "后来 · 大学篇",
      back: "2329班散了，小组群可能安静了。但大哥从宁远一中一路当到财院，排面不能少。小弟在长沙工业学院，负责跨校送达。",
    },
  ],
};

export const wish = {
  title: "小弟有话说",
  letter: `大哥：
高中在2329班的小组里，你是能镇场子也能把大家逗笑的人。那时候我就是你旁边那个跟着笑的小弟。
现在你在湖南财经学院，我在长沙工业学院，同在一座城，不同校门。
但有些称呼不会变——你还是大哥，我还是那个小弟。
新的一岁，继续做你自己，继续笑得最大声。
生日快乐，大哥。`,
  signature: "——你小弟",
  remarks: [
    {
      tag: "讲义气",
      summary: "大哥不是白叫的。",
      detail: "当年小组里有什么事，你从来没躲过。",
    },
    {
      tag: "笑点低",
      summary: "小组快乐源泉。",
      detail: "大哥一笑，全组跟着笑，课都听不进去。",
    },
    {
      tag: "跨校认证",
      summary: "高中是2329班的大哥，大学是财院的大哥。",
      detail: "称呼没变，小弟也没变，就是校门换了。",
    },
  ],
};

export const route = {
  title: "同在一座城，不同校门",
  from: { name: "长沙工业学院", note: "小弟所在地" },
  to: { name: "湖南财经学院", note: "大哥坐镇处" },
  arrived: "小弟的生日排面已送达",
  cta: "大哥，最后一页有蛋糕",
};

export const cake = {
  title: "大哥的生日蛋糕",
  plate: "2329 → 财院",
  cta: "大哥，许个愿，然后吹蜡烛。",
  message: [
    "大哥，生日快乐！",
    "从宁远一中2329班到湖南财经学院，",
    "小弟在长沙工业学院，准时送达。",
    "新的一岁，继续做大哥，继续笑得最大声。",
  ],
  footnote: "同在一座城，下次约饭别装没看见。——你小弟",
  replay: "重新播放",
};

export const music = {
  off: "点这里，有一首你肯定听过的歌",
  on: "正在播放 · 再点暂停",
};

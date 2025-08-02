// Mock data for Thai learning cards
const MockData = {
  // Sample cards for each level
  cards: {
    1: [
      {
        id: 1,
        thai: "สวัสดี",
        chinese: "你好",
        pronunciation: "sà-wàt-dii",
        example: "สวัสดีครับ ผมชื่อจอห์น",
        example_translation: "你好，我叫约翰",
        level: 1
      },
      {
        id: 2,
        thai: "ขอบคุณ",
        chinese: "谢谢",
        pronunciation: "kɔ̀ɔp-kun",
        example: "ขอบคุณมากครับ",
        example_translation: "非常感谢",
        level: 1
      },
      {
        id: 3,
        thai: "ไม่เป็นไร",
        chinese: "没关系",
        pronunciation: "mâi-pen-rai",
        example: "ไม่เป็นไรครับ ไม่ต้องกังวล",
        example_translation: "没关系，不用担心",
        level: 1
      },
      {
        id: 4,
        thai: "ลาก่อน",
        chinese: "再见",
        pronunciation: "laa-gɔ̀ɔn",
        example: "ลาก่อนนะครับ แล้วเจอกัน",
        example_translation: "再见，回头见",
        level: 1
      },
      {
        id: 5,
        thai: "ใช่",
        chinese: "是的",
        pronunciation: "châi",
        example: "ใช่ครับ ผมเข้าใจแล้ว",
        example_translation: "是的，我明白了",
        level: 1
      }
    ],
    2: [
      {
        id: 6,
        thai: "อาหาร",
        chinese: "食物",
        pronunciation: "aa-hǎan",
        example: "อาหารไทยอร่อยมาก",
        example_translation: "泰国菜很好吃",
        level: 2
      },
      {
        id: 7,
        thai: "น้ำ",
        chinese: "水",
        pronunciation: "náam",
        example: "ขอน้ำหนึ่งแก้วครับ",
        example_translation: "请给我一杯水",
        level: 2
      },
      {
        id: 8,
        thai: "บ้าน",
        chinese: "家",
        pronunciation: "bâan",
        example: "บ้านของผมอยู่ใกล้ที่นี่",
        example_translation: "我家离这里很近",
        level: 2
      }
    ],
    3: [
      {
        id: 9,
        thai: "การทำงาน",
        chinese: "工作",
        pronunciation: "gaan-tam-ngaan",
        example: "การทำงานของผมเริ่มเวลา 9 โมง",
        example_translation: "我的工作9点开始",
        level: 3
      },
      {
        id: 10,
        thai: "โรงเรียน",
        chinese: "学校",
        pronunciation: "roong-rian",
        example: "โรงเรียนนี้มีนักเรียนเยอะมาก",
        example_translation: "这所学校有很多学生",
        level: 3
      }
    ],
    4: [
      {
        id: 11,
        thai: "ความสุข",
        chinese: "幸福",
        pronunciation: "kwaam-sùk",
        example: "ความสุขที่แท้จริงมาจากครอบครัว",
        example_translation: "真正的幸福来自家庭",
        level: 4
      },
      {
        id: 12,
        thai: "ประสบการณ์",
        chinese: "经验",
        pronunciation: "prà-sòp-gaan",
        example: "ประสบการณ์นี้ทำให้ผมเรียนรู้มาก",
        example_translation: "这个经验让我学到很多",
        level: 4
      }
    ]
  },

  // Get cards by level
  getCardsByLevel: (level) => {
    return MockData.cards[level] || [];
  },

  // Get random cards from level (max 10)
  getRandomCards: (level, limit = 10) => {
    const cards = MockData.getCardsByLevel(level);
    if (cards.length <= limit) return cards;
    
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  },

  // Get all cards
  getAllCards: () => {
    return Object.values(MockData.cards).flat();
  },

  // Course information
  courseInfo: {
    1: {
      title: "基础泰语 1",
      description: "泰语入门基础，学习日常问候和基本词汇",
      totalCards: 5,
      color: "bg-blue-500"
    },
    2: {
      title: "基础泰语 2", 
      description: "日常生活词汇，食物、家庭、基本对话",
      totalCards: 3,
      color: "bg-green-500"
    },
    3: {
      title: "基础泰语 3",
      description: "工作和学习相关词汇，中级对话",
      totalCards: 2,
      color: "bg-purple-500"
    },
    4: {
      title: "基础泰语 4",
      description: "高级词汇和表达，抽象概念和复杂句型",
      totalCards: 2,
      color: "bg-orange-500"
    }
  }
};
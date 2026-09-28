import { useState, useEffect, useRef } from 'react';
import './App.css';

// Google Apps Script エンドポイント
const GAS_URL = "https://script.google.com/macros/s/AKfycbw0wmVvLZxN8qqffSh3JYGtTzsnHOBN9uOav22vPdZSGL28QgnrWVaSSnzSRZ25-CQ4fg/exec";

const sendToGAS = async (data: object) => {
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
      redirect: 'follow' as RequestRedirect,
    });
  } catch (e) {
    console.error('GAS送信エラー:', e);
  }
};

// 型定義
type Phase =
  | 'title' | 'warning'
  | 'opening1' | 'opening2' | 'opening3'
  | 'stage1' | 'stage2' | 'stage3' | 'stage3_rolling' | 'stage3_losing'
  | 'ending1' | 'ending2' | 'special' | 'thanks';

type CardCategory = 'green' | 'pink' | 'blue' | 'yellow' | 'purple';

interface Card {
  id: string;
  category: CardCategory;
  text: string;
  description?: string;
  isLost: boolean;
}

const lang = new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'ja';

const CATEGORY_LABELS: Record<CardCategory, string> = lang === 'en' ? {
  green: 'Objects',
  pink: 'People',
  blue: 'Places',
  yellow: 'Events',
  purple: 'Goals'
} : {
  green: '物',
  pink: '人',
  blue: '場所',
  yellow: '出来事',
  purple: '目標'
};

const CATEGORY_EXAMPLES: Record<CardCategory, string> = lang === 'en' ? {
  green: 'PC, phone, etc.',
  pink: 'Mother, friend, etc.',
  blue: 'My room, school, etc.',
  yellow: 'Passing exam, travel, etc.',
  purple: 'Employment, marriage, etc.'
} : {
  green: 'PC, 携帯など',
  pink: '母, 友人など',
  blue: '自室, 学校など',
  yellow: '合格, 旅行など',
  purple: '就職, 結婚など'
};

const CATEGORY_HINTS: Record<CardCategory, string> = lang === 'en' ? {
  green: 'What possessions\ndo you cherish?',
  pink: 'Who is the most\nimportant person in your life?',
  blue: 'Is there a place you cherish?\nWhere is it?',
  yellow: 'What is an unforgettable\nevent for you?',
  purple: 'What is a meaningful\ngoal for you?'
} : {
  green: 'あなたが大切にしている\nものは何ですか？',
  pink: 'あなたの人生で\n最も大切な人は誰ですか？',
  blue: '大切だと感じる場所はありますか？\nそれはどこですか？',
  yellow: 'あなたにとって\n忘れられない出来事は何ですか？',
  purple: 'あなたにとって\n意味のある目標は何ですか？'
};

// 日英対応翻訳辞書
const T = {
  title: 'THE DICE OF DESTINY',
  subTitle: 'The Educational Effects of Games about Loss: Focusing on well-being',
  codeAutofilled: lang === 'en' ? 'Your anonymous code is automatically filled' : 'あなたの匿名コードが自動入力されています',
  codeVerify: lang === 'en' ? 'Please verify that it matches the code you just created' : '先ほど作成したコードと一致していることを確認してください',
  codePlaceholder: lang === 'en' ? 'e.g. 0622-136' : '例: 0622-136',
  codeError: lang === 'en' ? 'Please enter your anonymous code (e.g. 0622-136)' : '匿名コードを入力してください（例: 0622-136）',
  startExperience: lang === 'en' ? 'Start Experience' : '体験を始める',
  selfReflectionNote: lang === 'en' ? 'This game is intended for self-reflection through loss experience.\n* Participation and withdrawal are completely voluntary. You can stop at any time.' : 'このゲームは、喪失体験を通じた自己対話を目的としています。\n※ 参加と中止は完全に自由です。不快感を感じた場合はいつでも中止できます。',
  
  // renderWarning
  warningTitle: lang === 'en' ? 'Precautions' : '注意事項',
  aboutExperience: lang === 'en' ? 'About this experience' : 'この体験について',
  w1: lang === 'en' ? 'This is a game. The experience during play differs from reality.' : 'これはゲームです。プレイ中の体験は現実とは異なります。',
  w2: lang === 'en' ? 'Your participation and withdrawal from this game are completely voluntary.' : 'このゲームへの参加および中止は、完全にあなたの自由です。',
  w3: lang === 'en' ? 'Your participation in the game and its results will not affect your evaluation.' : 'ゲームへの参加やその結果が、個人の評価に影響することはありません。',
  w4: lang === 'en' ? 'If you feel uncomfortable during play, you can stop the game immediately.' : 'プレイ中に気分を害した場合は、すぐにゲームを中止することができます。',
  w5: lang === 'en' ? 'No one can force you to participate in or continue the game.' : '誰もあなたにゲームへの参加や継続を強制することはできません。',
  requiredTime: lang === 'en' ? 'Required time: Approx. 30 minutes' : '所要時間: 約30分',
  plentyTime: lang === 'en' ? 'Please experience it with plenty of time.' : '時間に余裕を持って体験してください。',
  understandStart: lang === 'en' ? 'I understand and start the experience' : '理解して体験を開始する',

  // renderOpening
  opening1: [
    lang === 'en' ? "Suddenly, everything around you is wrapped in darkness." : "突然、あなたの周りのすべてが暗闇に包まれます。",
    lang === 'en' ? "When you open your eyes, you find yourself in a strange and unfamiliar world." : "目を開けると、あなたは奇妙で見知らぬ世界にいました。",
    lang === 'en' ? "In front of you stands a child in a bizarre and colorful costume. As your eyes meet, the child speaks to you." : "目の前には、奇抜でカラフルな衣装を着た子供が立っています。目が合うと、その子供はあなたに語りかけてきました。",
    lang === 'en' ? "“I am speaking to your heart. You have met with an unexpected misfortune. Life may never be the same again. This accident is so massive that you might lose everything you hold dear.”" : "「君の心に話しかけているよ。君は予期せぬ不幸に見舞われたんだ。人生はもう二度と元には戻らないかもしれない。この事故はあまりにも大きく、君が大切にしているすべてを失ってしまうかもしれないんだ。」",
    lang === 'en' ? "You look back in confusion, not understanding what is happening..." : "あなたは何が起きているのか理解できず、困惑して見つめ返します……"
  ],
  opening2: [
    lang === 'en' ? "“You must be thinking, ‘What on earth are you talking about?’ That is natural. But please, trust me. What you are about to experience is deeply connected to your life.”" : "「『一体何を言っているんだ？』と思っているだろうね。それは当然だ。でも、お願いだ、僕を信じて。君がこれから体験することは、君の人生と深くつながっているんだ。」",
    lang === 'en' ? "Before you can process those words, another surprise arrives." : "あなたがその言葉を処理する間もなく、さらなる驚きが訪れます。",
    lang === 'en' ? "“You are not the only one facing this misfortune. Others are too. And you all have been given a chance—a chance to use what is called the ‘Dice of Destiny’.”" : "「この不幸に直面したのは君だけじゃない。他の人たちもそうだ。そして、君たちはチャンスを与えられたんだ――運命のサイコロ『ダイス・オブ・ディスティニー』と呼ばれるものを使うチャンスをね。」",
    lang === 'en' ? "The child leaned in and lowered their voice, as if emphasizing its importance." : "子供は身を乗り出し、その重要性を強調するかのように声を潜めました。",
    lang === 'en' ? "“This is the most important thing, so do not forget. By using this dice, you may realize what is most precious to you. Not only that, you might be guided to a better life than now.”" : "「これは一番大事なことだから、忘れないで。このサイコロを使うことで、君は最も大切なものに気がつくかもしれない。それだけじゃない、今よりももっと良い人生へと導かれるかもしれないんだ。」"
  ],
  opening3: [
    lang === 'en' ? "Just as you were about to ask for a clearer explanation..." : "あなたがもっと明確な説明を求めようとしたその時……",
    lang === 'en' ? "“I know you want a detailed explanation,” the child interrupts. “But there is no time. It is starting now.”" : "「詳しく説明してほしいのはわかるよ」と子供は遮ります。「でも時間がないんだ。もう始まるよ。」",
    lang === 'en' ? "Though anxious, you understand that this child is speaking seriously." : "あなたは不安を感じつつも、この子供が真面目に話していることを理解します。",
    lang === 'en' ? "“Thank you for listening,” the child continues. “Now, write down the things most precious to you on the cards. As many as possible. Then, just like the others, roll the Dice of Destiny.”" : "「聞いてくれてありがとう」と子供は続けます。「さあ、君にとって最も大切なものをカードに書き出すんだよ。できるだけたくさんね。そして、他の人たちと同じように、運命のサイコロを振るんだ。」",
    lang === 'en' ? "The child suddenly brought their face close to yours as if warning you:" : "子供は突然、警告するかのようにあなたに顔を近づけて言いました。",
    lang === 'en' ? "“Remember—always follow the Master's instructions. Do not act on your own. I sincerely hope that your life will become better because of this.”" : "「覚えておいて――マスターの指示には必ず従うこと。勝手な行動はしちゃいけないよ。君の人生がこれによって良くなることを、心から願っているよ。」",
    lang === 'en' ? "With those final words, the child vanished from your sight—just as they had appeared." : "その言葉を最後に、子供はあなたの視界から消えていきました――現れたときと同じように。"
  ],
  next: lang === 'en' ? 'Next' : '次へ',

  // renderStage1
  s1PreciousCards: lang === 'en' ? 'Precious Thing Cards' : '【大切なものカード】',
  s1MissionTitle: lang === 'en' ? 'Mission:' : 'ミッション:',
  s1MissionDesc: lang === 'en' ? 'List what is precious to you.' : 'あなたにとって大切なものを挙げてください。',
  s1GoalTitle: lang === 'en' ? 'Goal:' : 'ゴール:',
  s1GoalDesc: lang === 'en' ? 'Create 5 or more cards containing things truly precious to you.' : '本当に大切なものが書かれたカードを５枚以上作成してください。',
  s1Time: lang === 'en' ? 'Time required: 5-10 min' : '所要時間: 5-10分',
  s1NoRightOrWrong: lang === 'en' ? 'There are no right or wrong answers. Just write what comes to your mind.' : '正解や不正解はありません。思いついたことをそのまま書いてください。',
  s1HintText: lang === 'en' ? 'Click each category and type in the blank space to complete a card for that category.' : '各テーマをクリックして空欄に入力すると、そのテーマのカードが完成します。',
  s1CurrentCards: lang === 'en' ? 'Current cards' : '現在の枚数',
  s1Go2ndStage: lang === 'en' ? 'Go to 2nd Stage' : '2nd Stageへ進む',
  s1InputPlaceholder: lang === 'en' ? 'Type a precious thing...' : '大切なものごとを入力...',
  s1CreateBtn: lang === 'en' ? 'Create' : '作成',
  s1DeleteTitle: lang === 'en' ? 'Delete this card' : 'このカードを削除',
  s1MaxCardsAlert: lang === 'en' ? 'Maximum of 25 cards reached.' : 'カードは最大25枚までです。',

  // renderStage2
  s2HiddenStories: lang === 'en' ? 'Hidden Stories' : '【秘められた物語】',
  s2MissionDesc: lang === 'en' ? 'Write the story behind the cards.' : 'カードの背景にあるストーリーを書いてください。',
  s2GoalDesc: lang === 'en' ? 'Write down your hidden stories.' : '秘められたストーリーを書き上げる。',
  s2Time: lang === 'en' ? 'Time required: 5-10 min' : '所要時間: 5-10分',
  s2IntroText: lang === 'en' ? 'Select at least one card and write a story about why it is precious. Try writing it as if you are telling it to someone.' : '少なくとも１枚のカードを選択し、なぜそれが大切なのかを伝えるストーリーを書いてください。\n誰かに話して聞かせるように書いてみましょう。',
  s2Example: lang === 'en' ? 'Example: "Place: Living Room"\nThis is the living room where I spent time with my family. I have many memories of everyone gathering here. My mother...' : '例: 「場所　リビングルーム」\nこの場所は私が家族と過ごしたリビングルームです。いつもみんなで集まって、たくさんの思い出があります。私の母が……',
  s2Go3rdStage: lang === 'en' ? 'Go to 3rd Stage' : '3rd Stageへ進む',
  s2MinOneStoryNote: lang === 'en' ? '* You can proceed after saving at least one card\'s story.' : '※ 最低1つのカードの物語を保存すると次へ進めます',
  s2WrittenBadge: lang === 'en' ? 'Written ✓' : '記入済み ✓',
  s2SelectedCard: lang === 'en' ? 'Selected Card' : '選択中のカード',
  s2TextareaPlaceholder: lang === 'en' ? 'Imagine the person you want to tell, and write down the episodes or reasons why you cherish it...' : '伝えたい相手を想像し、関連するエピソードや大切にしている理由を書き記してください...',
  s2SaveBtn: lang === 'en' ? 'Save' : '保存する',
  s2SelectCardPrompt: lang === 'en' ? 'Select a card from the left.' : '左のカードから一つ選んでください。',

  // renderStage3
  s3DiceOfDestiny: lang === 'en' ? 'Dice of Destiny' : '【運命のダイス】',
  s3IntroText: lang === 'en' ? 'Every time you roll the Dice of Destiny, you must let go of something precious to you.' : '運命のダイスを振るたびに、あなたの大切なものを手放さなければなりません。',
  s3Time: lang === 'en' ? 'Time required: 5-10 min' : '所要時間: 5-10分',
  s3DifficultyNote: lang === 'en' ? '* Select a difficulty mode to adjust the number of cards to lose.' : '※モード（難易度）を選択して喪失する枚数を調整しましょう',
  s3RemainingCards: lang === 'en' ? 'Remaining cards' : '残りカード',
  s3RollCount: lang === 'en' ? 'Dice rolled' : 'ダイス使用回数',
  s3MinRolls: lang === 'en' ? 'Min 4 times' : '最低4回',
  s3EasyDesc: lang === 'en' ? 'Lose [rolled eyes - 2] cards (Min 1 card)' : '出た目−2枚のカードを喪失（最低1枚）',
  s3NormalDesc: lang === 'en' ? 'Lose the same number of cards as rolled' : '出た目と同じ枚数のカードを喪失',
  s3HardDesc: lang === 'en' ? 'Lose [rolled eyes + 2] cards' : '出た目+2枚のカードを喪失',
  s3RollBtn: lang === 'en' ? 'Roll Dice' : 'ダイスを振る',
  s3DeterminingFate: lang === 'en' ? 'Determining fate...' : '運命を決定中...',
  s3LosingIntro: lang === 'en' ? 'You will lose {count} cards by fate.\nPlease click to select which cards to lose.' : '運命により {count} 枚のカードを失います。\n失うカードをクリックして選択してください。',
  s3GoEnding: lang === 'en' ? 'Go to Ending' : 'エンディングへ進む',

  // renderEnding
  ending1: [
    lang === 'en' ? "Before you knew it, the child in the bizarre costume was standing next to you." : "いつの間にか、奇抜な衣装を着た子供があなたの隣に立っていました。",
    lang === 'en' ? "“Hey! You tried using the ‘Dice of Destiny’, didn't you?”" : "「やあ！ 『運命のサイコロ』を使ってみたんだね？」",
    lang === 'en' ? "The child spoke to you again." : "子供は再び話しかけてきました。",
    lang === 'en' ? "“Which cards remained, and which ones did you lose?”" : "「どのカードが残って、どのカードを失ったの？」",
    lang === 'en' ? "Staring at the lost cards, the child asked, “What did this experience mean to you?”" : "失われたカードを見つめながら、子供は尋ねました。「この体験は、君にとってどんな意味があった？」",
    lang === 'en' ? "...What meaning did it have? You fall into deep thought." : "――どんな意味があっただろう？ あなたは考え込みます。",
    lang === 'en' ? "“I know! Before you go back to the real world, why not write a message to someone precious to you (family, partner, friend, etc.) about what you felt and thought through this experience?”" : "「そうだ！ 現実の世界に戻る前に、君の大切な人（家族、パートナー、友人など）へ、この体験を通じて感じたことや考えたことをメッセージにしてみない？」"
  ],
  ending2: [
    lang === 'en' ? "Having rolled all the dice, you slowly close your eyes." : "すべてのサイコロを振り終え、あなたはゆっくりと目を閉じます。",
    lang === 'en' ? "Then, you hear the Master's voice." : "すると、マスターの声が聞こえてきます。",
    lang === 'en' ? "“Everything you hold in life will one day be lost. Everyone, without exception, will face death.”" : "「人生で手にするすべてのものは、いつか失われる日が来る。誰しも、例外なく、死を迎える時が来るのだ。」",
    lang === 'en' ? "The voice continues:" : "さらに、声は続きます。",
    lang === 'en' ? "“But at this very moment, you are alive. And the things you cherish are with you.”" : "「だが、今この瞬間、お前は生きている。そして、お前が大切に思うものは、お前と共にあるのだ。」",
    lang === 'en' ? "As the Master's voice fades and you open your eyes again, you are in the same place as before." : "マスターの声が聞こえなくなり、再び目を開けると、あなたは以前と同じ場所にいました。",
    lang === 'en' ? "You realize you have had a wondrous experience—an experience where the most precious things are lost by fate." : "あなたは不思議な体験をしたことに気づきます――運命によって最も大切なものが失われるという体験を。",
    lang === 'en' ? "You take a deep breath. Your mind is peaceful. And life feels just a little brighter than before." : "あなたは深く息を吸い込みます。心は穏やかです。そして、人生が以前よりも少し明るく感じられるのです。"
  ],
  endingActiveCards: lang === 'en' ? 'Cards in hand' : '手元に残ったカード',
  endingLostCards: lang === 'en' ? 'Lost cards' : '失ったカード',
  endingCompleteBtn: lang === 'en' ? 'Complete Experience' : '体験を完了する',

  // renderSpecial
  specLetter: lang === 'en' ? 'Letter to That Person' : '【あの人への手紙】',
  specIntro: lang === 'en' ? 'Let\'s write a message to someone precious to you (family, partner, friend, etc.) about what you felt and thought through this experience.' : '大切な人（家族、パートナー、友人など）へ、この体験を通じて感じたことや考えたことをメッセージにしてみましょう',
  specRecipientPlaceholder: lang === 'en' ? 'Name or relationship of the precious person...' : '大切な人の名前や関係..',
  specMessagePlaceholder: lang === 'en' ? 'Thinking of your precious one, write your message here...' : '大切な人を想い、ここにメッセージを記します...',

  // renderThanks
  thanksMessage: lang === 'en' ? 'We hope that this experience supports your health and happiness, and contributes to a more fulfilling life.\nWe look forward to seeing you again.\nThank you very much.' : 'この体験が、\nあなたの健康と幸福の支えとなり、\nより充実した人生を送る一助となることを願っています。\nいつかまた、\nご一緒できることを楽しみにしています。\n本当にありがとうございました。',
  thanksGoTitle: lang === 'en' ? 'Go to Title Screen' : 'タイトル画面へ',
  thanksGoSurvey: lang === 'en' ? 'Go to Post-experience Survey' : '体験後のご質問へ'
};

function App() {
  const [phase, setPhase] = useState<Phase>('title');

  // ステージ1: カード
  const [cards, setCards] = useState<Card[]>([]);
  const [inputCategory, setInputCategory] = useState<CardCategory>('green');
  const [inputText, setInputText] = useState('');

  // ステージ2: 共有
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [shareText, setShareText] = useState('');

  // Special Stage: 最後のメッセージ
  const [recipientName, setRecipientName] = useState('');
  const [finalMessage, setFinalMessage] = useState('');

  // ステージ3: 喪失
  const [difficulty, setDifficulty] = useState<'EASY' | 'NORMAL' | 'HARD'>('NORMAL');
  const [diceRolls, setDiceRolls] = useState(0); // 振った回数
  const [currentDice, setCurrentDice] = useState<number>(1);
  const [isRolling, setIsRolling] = useState(false);
  const [cardsToLose, setCardsToLose] = useState(0);

  // データ収集
  const [anonymousCode, setAnonymousCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [lostCardsOrder, setLostCardsOrder] = useState<Array<{order: number; category: string; text: string}>>([]);
  const hasSent = useRef(false);

  // 背景画像のパス
  const bgImage = `url('${import.meta.env.BASE_URL}assets/fantasy_bg.jpg')`;

  // --- ハンドラー ---
  const addCard = () => {
    if (!inputText.trim()) return;
    if (cards.length >= 25) {
      alert('カードは最大25枚までです。');
      return;
    }
    const newCard: Card = {
      id: Date.now().toString(),
      category: inputCategory,
      text: inputText,
      isLost: false,
    };
    setCards([...cards, newCard]);
    setInputText('');
  };

  const removeCard = (cardId: string) => {
    setCards(cards.filter(c => c.id !== cardId));
  };

  const rollDice = () => {
    setIsRolling(true);
    setPhase('stage3_rolling');

    // アニメーション用のタイマー
    let rolls = 0;
    const interval = setInterval(() => {
      setCurrentDice(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 15) {
        clearInterval(interval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setCurrentDice(finalDice);
        setIsRolling(false);
        setDiceRolls(prev => prev + 1);

        // 喪失枚数の計算
        let loseCount = 0;
        if (difficulty === 'EASY') {
          loseCount = Math.max(1, finalDice - 2);
        } else if (difficulty === 'NORMAL') {
          loseCount = finalDice;
        } else {
          // HARD MODE
          loseCount = finalDice + 2;
        }

        const remainingActiveCards = cards.filter(c => !c.isLost).length;
        loseCount = Math.min(loseCount, remainingActiveCards);

        if (loseCount > 0) {
          setCardsToLose(loseCount);
          setPhase('stage3_losing');
        } else {
          if (remainingActiveCards === 0) {
            setPhase('ending1');
          } else {
            setPhase('stage3');
          }
        }
      }
    }, 100);
  };

  const handleLoseCard = (cardId: string) => {
    if (phase !== 'stage3_losing') return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isLost) return;

    const order = lostCardsOrder.length + 1;
    setLostCardsOrder(prev => [...prev, { order, category: CATEGORY_LABELS[card.category], text: card.text }]);
    setCards(cards.map(c => c.id === cardId ? { ...c, isLost: true } : c));
    setCardsToLose(prev => prev - 1);
  };

  // 喪失枚数が0になったら状態を戻す
  useEffect(() => {
    if (phase === 'stage3_losing' && cardsToLose <= 0) {
      const remainingActiveCards = cards.filter(c => !c.isLost).length;
      if (remainingActiveCards === 0) {
        setPhase('ending1');
      } else {
        setPhase('stage3');
      }
    }
  }, [cardsToLose, phase, cards]);

  // thanks フェーズ到達時にゲームデータを GAS へ送信
  useEffect(() => {
    if (phase === 'thanks' && !hasSent.current) {
      hasSent.current = true;
      const endTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().replace('Z', '');
      const gameData = {
        type: 'game',
        game: 'Dice of Destiny',
        anonymousCode,
        startTime,
        endTime,
        timestamp: endTime,
        stage1_cards: cards.map(c => ({ category: CATEGORY_LABELS[c.category], text: c.text })),
        stage2_stories: cards
          .filter(c => c.description)
          .map(c => ({ category: CATEGORY_LABELS[c.category], text: c.text, story: c.description })),
        stage3_lostCards: lostCardsOrder,
        special_recipientName: recipientName,
        special_message: finalMessage,
      };
      sendToGAS(gameData);
    }
  }, [phase]);

  // タイトル画面表示時に localStorage から匿名コードを自動入力
  useEffect(() => {
    if (phase === 'title' && !anonymousCode) {
      try {
        const saved = localStorage.getItem('survey_anon_code');
        if (saved) setAnonymousCode(saved);
      } catch (e) {}
    }
  }, [phase]);

  // フェーズが変わるたびにスクロールを一番上に戻す
  useEffect(() => {
    const contentEl = document.querySelector('.content');
    if (contentEl) {
      contentEl.scrollTop = 0;
    }
  }, [phase]);

  // --- レンダーコンポーネント ---

  const renderTitle = () => (
    <div className="story-screen" style={{ flexDirection: 'column', textAlign: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem', letterSpacing: '0.2rem', fontFamily: '"Times New Roman", Times, serif', fontWeight: 'bold', textShadow: '2px 2px 10px rgba(0,0,0,0.8)' }}>{T.title}</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 1, textShadow: '1px 1px 5px rgba(0,0,0,0.8)' }}>{T.subTitle}</p>
      <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.45)', borderRadius: '12px', padding: '1.2rem 1.8rem', display: 'inline-block' }}>
        <p style={{ fontSize: '0.95rem', marginBottom: '0.2rem', color: '#ffffff', fontWeight: 'bold', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{T.codeAutofilled}</p>
        <p style={{ fontSize: '0.85rem', marginBottom: '0.8rem', color: '#E0E8FF', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{T.codeVerify}</p>
        <input
          type="text"
          value={anonymousCode}
          onChange={e => { setAnonymousCode(e.target.value.toUpperCase()); setCodeError(false); }}
          placeholder={T.codePlaceholder}
          maxLength={10}
          style={{ padding: '0.7rem 1.2rem', fontSize: '1.4rem', borderRadius: '8px', border: codeError ? '2px solid #f07070' : '2px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.2)', color: '#fff', textAlign: 'center', letterSpacing: '0.3rem', width: '240px', outline: 'none', fontWeight: 'bold', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
        />
        {codeError && <p style={{ color: '#f07070', fontSize: '0.85rem', marginTop: '0.4rem' }}>{T.codeError}</p>}
      </div>
      <button
        className="next-button"
        style={{ fontSize: '1.4rem', padding: '1.2rem 3rem', borderRadius: '50px', background: 'rgba(138, 43, 226, 0.6)', border: '2px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
        onClick={() => {
          if (!anonymousCode.trim()) { setCodeError(true); return; }
          setStartTime(new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().replace('Z', ''));
          setPhase('warning');
        }}
      >
        {T.startExperience}
      </button>
      <div style={{ marginTop: '2rem', fontSize: '0.85rem', opacity: 1, textAlign: 'center', lineHeight: '2', textShadow: '1px 1px 4px rgba(0,0,0,0.8)', fontWeight: 'bold', whiteSpace: 'pre-line' }}>
        {T.selfReflectionNote}
      </div>
    </div>
  );

  const renderWarning = () => (
    <div className="story-screen" style={{ flexDirection: 'column', textAlign: 'center', padding: '2rem' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#fff' }}>{T.warningTitle}</h2>
      <div style={{ fontSize: '1.1rem', lineHeight: '2.2', textAlign: 'left', maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '15px', color: '#fff' }}>
        <h3 style={{ borderBottom: '1px solid #fff', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#fff' }}>{T.aboutExperience}</h3>
        <ul style={{ listStyleType: 'disc', paddingLeft: '2rem', marginBottom: '1.5rem', color: '#fff' }}>
          <li>{T.w1}</li>
          <li>{T.w2}</li>
          <li>{T.w3}</li>
          <li>{T.w4}</li>
          <li>{T.w5}</li>
        </ul>
        <p style={{ fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center', marginTop: '2rem', color: '#fff' }}>
          {T.requiredTime}<br />
          <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#fff' }}>{T.plentyTime}</span>
        </p>
      </div>
      <button
        className="next-button"
        style={{ marginTop: '3rem', fontSize: '1.2rem', padding: '1rem 3rem' }}
        onClick={() => setPhase('opening1')}
      >
        {T.understandStart}
      </button>
    </div>
  );

  const renderOpening = () => {
    let text: string[] = [];
    if (phase === 'opening1') {
      text = T.opening1;
    } else if (phase === 'opening2') {
      text = T.opening2;
    } else if (phase === 'opening3') {
      text = T.opening3;
    }

    return (
      <div className="story-screen" style={{ alignItems: 'flex-start', paddingTop: '8rem' }}>
        <div className="story-text">
          {text.map((line, i) => <p key={i}>{line}</p>)}
          <button
            className="next-button"
            onClick={() => {
              if (phase === 'opening1') setPhase('opening2');
              else if (phase === 'opening2') setPhase('opening3');
              else setPhase('stage1');
            }}
          >
            {T.next}
          </button>
        </div>
        <img src={`${import.meta.env.BASE_URL}assets/図1.png`} className="character-image" style={{ opacity: 0.5, WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)', maskImage: 'radial-gradient(circle, black 30%, transparent 70%)', alignSelf: 'center' }} alt="Master" />
      </div>
    );
  };

  const renderStage1 = () => (
    <div className="stage-container">
      <div className="header">
        <h2>Stage 1</h2>
        <h3 style={{ margin: '0.5rem 0' }}>{T.s1PreciousCards}</h3>
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
          <p><strong>{T.s1MissionTitle}</strong> {T.s1MissionDesc}</p>
          <p><strong>{T.s1GoalTitle}</strong> {T.s1GoalDesc}</p>
          <p style={{ marginTop: '1rem' }}><strong>{T.s1Time}</strong></p>
          <p style={{ color: '#ffffff', fontWeight: 'bold' }}>{T.s1NoRightOrWrong}</p>
          <p>{T.s1HintText}</p>
        </div>
        <p>{T.s1CurrentCards}: {cards.length} / 25</p>
        <div style={{ marginTop: '0.5rem', visibility: cards.length >= 5 ? 'visible' : 'hidden' }}>
          <button className="next-button" style={{ fontSize: '1.4rem', padding: '1.2rem 3rem', borderRadius: '50px', background: 'rgba(138, 43, 226, 0.6)', border: '2px solid white' }} onClick={() => setPhase('stage2')}>{T.s1Go2ndStage}</button>
        </div>
      </div>

      <div className="category-buttons">
        {(Object.keys(CATEGORY_LABELS) as CardCategory[]).map(cat => (
          <button
            key={cat}
            className={`category-btn ${cat} ${inputCategory === cat ? 'selected' : ''}`}
            onClick={() => setInputCategory(cat)}
            data-hint={CATEGORY_HINTS[cat]}
          >
            <span className="category-btn-label">{CATEGORY_LABELS[cat]}</span>
            <span className="category-btn-example">{CATEGORY_EXAMPLES[cat]}</span>
          </button>
        ))}
      </div>

      <div className="card-form">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) addCard(); }}
          placeholder={T.s1InputPlaceholder}
        />
        <button className="btn-add" onClick={addCard}>{T.s1CreateBtn}</button>
      </div>

      <div className="cards-grid">
        {cards.map(c => (
          <div key={c.id} className={`card ${c.category}`}>
            <button
              className="card-delete-btn"
              onClick={(e) => { e.stopPropagation(); removeCard(c.id); }}
              title={T.s1DeleteTitle}
            >×</button>
            <span className="card-category">{CATEGORY_LABELS[c.category]}</span>
            <span className="card-text">{c.text}</span>
          </div>
        ))}
        {Array.from({ length: 25 - cards.length }).map((_, i) => (
          <div key={`empty-${i}`} style={{ width: '110px', height: '110px', border: '2px dashed rgba(255,255,255,0.3)', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '1.5rem' }}>+</div>
        ))}
      </div>
    </div>
  );

  const renderStage2 = () => {
    const activeCards = cards.filter(c => !c.isLost);
    return (
      <div className="stage-container">
        <div className="header">
          <h2>Stage 2</h2>
          <h3 style={{ margin: '0.5rem 0' }}>{T.s2HiddenStories}</h3>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
            <p><strong>{T.s1MissionTitle}</strong> {T.s2MissionDesc}</p>
            <p><strong>{T.s1GoalTitle}</strong> {T.s2GoalDesc}</p>
            <p style={{ marginTop: '1rem' }}><strong>{T.s2Time}</strong></p>
            <p style={{ marginTop: '1rem', whiteSpace: 'pre-line' }}>{T.s2IntroText}</p>
            <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '4px', textAlign: 'left', display: 'inline-block', whiteSpace: 'pre-line' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc' }}>{T.s2Example}</p>
            </div>
          </div>
          {activeCards.some(c => c.description) ? (
            <div style={{ marginTop: '0.5rem' }}>
              <button className="next-button" style={{ fontSize: '1.4rem', padding: '1.2rem 3rem', borderRadius: '50px', background: 'rgba(138, 43, 226, 0.6)', border: '2px solid white' }} onClick={() => setPhase('stage3')}>{T.s2Go3rdStage}</button>
            </div>
          ) : (
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>{T.s2MinOneStoryNote}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className="cards-grid">
              {activeCards.map(c => {
                const hasDescription = !!c.description;
                return (
                  <div
                    key={c.id}
                    className={`card ${c.category} ${hasDescription ? 'described' : ''}`}
                    style={{
                      transform: selectedCardId === c.id ? 'scale(1.1) translateY(-10px)' : 'none',
                      border: selectedCardId === c.id ? '4px solid white' : hasDescription ? '3px solid rgba(255,255,255,0.5)' : 'none',
                      cursor: hasDescription ? 'default' : 'pointer',
                      opacity: hasDescription ? 0.7 : 1,
                    }}
                    onClick={() => { if (!hasDescription) setSelectedCardId(c.id); }}
                  >
                    {hasDescription && <span className="card-described-badge">{T.s2WrittenBadge}</span>}
                    <span className="card-category">{CATEGORY_LABELS[c.category]}</span>
                    <span className="card-text">{c.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1 }} className="share-area">
            {selectedCardId ? (
              <>
                <h3>{T.s2SelectedCard}: {cards.find(c => c.id === selectedCardId)?.text}</h3>
                <textarea
                  value={shareText}
                  onChange={e => setShareText(e.target.value)}
                  placeholder={T.s2TextareaPlaceholder}
                />
                <button className="btn-add" onClick={() => {
                  setCards(cards.map(c => c.id === selectedCardId ? { ...c, description: shareText } : c));
                  setShareText('');
                  setSelectedCardId(null);
                }}>{T.s2SaveBtn}</button>
              </>
            ) : (
              <p>{T.s2SelectCardPrompt}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStage3 = () => {
    return (
      <div className="stage-container">
        <div className="header">
          <h2>Stage 3</h2>
          <h3 style={{ margin: '0.5rem 0' }}>{T.s3DiceOfDestiny}</h3>
          <p>{T.s3IntroText}</p>
          <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{T.s3Time}</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>{T.s3DifficultyNote}</p>
          <div className="stats" style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
            <span>{T.s3RemainingCards}: {cards.filter(c => !c.isLost).length}</span>
            <span>{T.s3RollCount}: {diceRolls} / {T.s3MinRolls}</span>
          </div>
        </div>

        {phase === 'stage3' && (
          <div className="dice-container">
            <div className="difficulty-buttons">
              <button
                className={`difficulty-btn ${difficulty === 'EASY' ? 'selected' : ''}`}
                onClick={() => setDifficulty('EASY')}
              >
                <span className="difficulty-btn-label">EASY</span>
              </button>
              <button
                className={`difficulty-btn ${difficulty === 'NORMAL' ? 'selected' : ''}`}
                onClick={() => setDifficulty('NORMAL')}
              >
                <span className="difficulty-btn-label">NORMAL</span>
              </button>
              <button
                className={`difficulty-btn ${difficulty === 'HARD' ? 'selected' : ''}`}
                onClick={() => setDifficulty('HARD')}
              >
                <span className="difficulty-btn-label">HARD</span>
              </button>
            </div>
            <p className="difficulty-desc">
              {difficulty === 'EASY' && T.s3EasyDesc}
              {difficulty === 'NORMAL' && T.s3NormalDesc}
              {difficulty === 'HARD' && T.s3HardDesc}
            </p>
            <button className="next-button" onClick={rollDice} style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}>
              {T.s3RollBtn}
            </button>
          </div>
        )}

        {phase === 'stage3_rolling' && (
          <div className="dice-container">
            <div className={`dice ${isRolling ? 'rolling' : ''}`}>
              {currentDice}
            </div>
            <h3>{T.s3DeterminingFate}</h3>
          </div>
        )}

        {phase === 'stage3_losing' && (
          <div className="dice-container">
            <div className="dice">{currentDice}</div>
            <h3 className="lose-instruction" style={{ whiteSpace: 'pre-line' }}>
              {T.s3LosingIntro.replace('{count}', cardsToLose.toString())}
            </h3>
          </div>
        )}

        <div className="cards-grid">
          {cards.map(c => (
            <div
              key={c.id}
              className={`card ${c.category} ${c.isLost ? 'lost' : ''}`}
              onClick={() => handleLoseCard(c.id)}
              style={{ cursor: phase === 'stage3_losing' && !c.isLost ? 'crosshair' : 'default' }}
            >
              <span className="card-category">{CATEGORY_LABELS[c.category]}</span>
              <span className="card-text">{c.text}</span>
            </div>
          ))}
        </div>

        {phase === 'stage3' && diceRolls >= 4 && (
          <div style={{ textAlign: 'center', marginTop: 'auto' }}>
            <button className="next-button" onClick={() => setPhase('ending1')}>{T.s3GoEnding}</button>
          </div>
        )}
      </div>
    );
  };

  const renderEnding = () => {
    let text: string[] = [];
    if (phase === 'ending1') {
      text = T.ending1;
    } else if (phase === 'ending2') {
      text = T.ending2;
    }

    return (
      <div className="story-screen" style={{ alignItems: 'flex-start', paddingTop: '8rem' }}>
        <div className="story-text">
          {text.map((line, i) => <p key={i}>{line}</p>)}
          {phase === 'ending1' && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', gap: '2rem', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span>{T.endingActiveCards}: <strong>{cards.filter(c => !c.isLost).length}</strong></span>
              <span>{T.endingLostCards}: <strong>{cards.filter(c => c.isLost).length}</strong></span>
            </div>
          )}
          <button
            className="next-button"
            onClick={() => {
              if (phase === 'ending1') setPhase('special');
              else setPhase('thanks');
            }}
          >
            {phase === 'ending2' ? T.endingCompleteBtn : T.next}
          </button>
        </div>
        <img src={phase === 'ending1' ? `${import.meta.env.BASE_URL}assets/Master1 2.png` : `${import.meta.env.BASE_URL}assets/Master2.png`} className="character-image" style={{ opacity: 0.5, WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)', maskImage: 'radial-gradient(circle, black 30%, transparent 70%)', alignSelf: 'center' }} alt="Character" />
      </div>
    );
  };

  const renderThanks = () => (
    <div className="story-screen" style={{ flexDirection: 'column', textAlign: 'center', justifyContent: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '2.5rem', letterSpacing: '0.2rem', fontFamily: '"Times New Roman", Times, serif', fontWeight: 'bold', color: '#fff', textShadow: '2px 2px 10px rgba(0,0,0,0.8)' }}>THE DICE OF DESTINY</h1>
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.7)', 
        padding: '3rem', 
        borderRadius: '20px', 
        boxShadow: '0 0 30px rgba(0,0,0,0.5)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <p style={{ fontSize: '1.3rem', lineHeight: '2.2', opacity: 1, color: '#fff', whiteSpace: 'pre-line' }}>
          {T.thanksMessage}
        </p>
      </div>
      <button
        className="next-button"
        style={{ marginTop: '3rem', fontSize: '1.2rem', padding: '1rem 3rem', borderRadius: '50px' }}
        onClick={() => {
          setPhase('title');
          setCards([]);
          setInputText('');
          setSelectedCardId(null);
          setShareText('');
          setDiceRolls(0);
          setCurrentDice(1);
          setCardsToLose(0);
          setRecipientName('');
          setFinalMessage('');
          setAnonymousCode('');
          setCodeError(false);
          setStartTime('');
          setLostCardsOrder([]);
          hasSent.current = false;
        }}
      >
        {T.thanksGoTitle}
      </button>
      <a
        href={lang === 'en' ? "https://sunaonahito.github.io/game-survey-v2/index_en.html" : "https://sunaonahito.github.io/game-survey-v2/index_v2_20260928.html"}
        target="_self"
        rel="noopener noreferrer"
        style={{ display: 'inline-block', marginTop: '1rem', fontSize: '1.2rem', padding: '1rem 3rem', borderRadius: '50px', background: 'rgba(232,164,74,0.6)', border: '2px solid rgba(232,164,74,0.9)', color: '#fff', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}
      >
        {T.thanksGoSurvey}
      </a>
    </div>
  );

  const renderSpecial = () => {
    return (
      <div className="stage-container">
        <div className="header">
          <h2>Special Stage</h2>
          <h3 style={{ margin: '0.5rem 0' }}>{T.specLetter}</h3>
          <p>{T.specIntro}</p>
        </div>

        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h3>{T.endingActiveCards} ({cards.filter(c => !c.isLost).length})</h3>
            <div className="cards-grid" style={{ zoom: 0.8 }}>
              {cards.filter(c => !c.isLost).map(c => (
                <div key={c.id} className={`card ${c.category}`}>
                  <span className="card-text">{c.text}</span>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: '2rem' }}>{T.endingLostCards} ({cards.filter(c => c.isLost).length})</h3>
            <div className="cards-grid" style={{ zoom: 0.8 }}>
              {cards.filter(c => c.isLost).map(c => (
                <div key={c.id} className={`card ${c.category} lost-no-label`}>
                  <span className="card-text">{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }} className="share-area">
            <input
              type="text"
              placeholder={T.specRecipientPlaceholder}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              style={{ padding: '1rem', fontSize: '1rem', borderRadius: '4px', border: 'none', background: '#f5f5f0', color: '#000', width: '100%', boxSizing: 'border-box' }}
            />
            <textarea
              placeholder={T.specMessagePlaceholder}
              value={finalMessage}
              onChange={(e) => setFinalMessage(e.target.value)}
            />
            <button className="next-button" onClick={() => setPhase('ending2')}>{T.next}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="game-container" style={{ backgroundImage: bgImage }}>
      <div className={`overlay ${(phase === 'title' || phase === 'thanks') ? 'title-mode' : ''}`}></div>
      <div className="content">
        {phase === 'title' && renderTitle()}
        {phase === 'warning' && renderWarning()}
        {phase.startsWith('opening') && renderOpening()}
        {phase === 'stage1' && renderStage1()}
        {phase === 'stage2' && renderStage2()}
        {phase.startsWith('stage3') && renderStage3()}
        {phase === 'special' && renderSpecial()}
        {phase.startsWith('ending') && renderEnding()}
        {phase === 'thanks' && renderThanks()}
      </div>
    </div>
  );
}

export default App;

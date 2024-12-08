type Listener<T = any> = (payload: T) => void;

class PubSub<Topics extends Record<string, any>> {
  private topics: { [K in keyof Topics]?: Listener<Topics[K]>[] } = {};

  /**
   * 订阅一个主题
   * @param topic - 主题名称
   * @param listener - 订阅者的回调函数
   * @returns 取消订阅的函数
   */
  subscribe<K extends keyof Topics>(
    topic: K,
    listener: Listener<Topics[K]>,
  ): () => void {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }
    this.topics[topic]!.push(listener);
    return () => this.unsubscribe(topic, listener);
  }

  /**
   * 取消订阅一个主题
   * @param topic - 主题名称
   * @param listener - 要移除的回调函数
   */
  unsubscribe<K extends keyof Topics>(
    topic: K,
    listener: Listener<Topics[K]>,
  ): void {
    if (!this.topics[topic]) return;
    this.topics[topic] = this.topics[topic]!.filter((l) => l !== listener);
    if (this.topics[topic]!.length === 0) {
      delete this.topics[topic];
    }
  }

  /**
   * 发布一个主题
   * @param topic - 主题名称
   * @param payload - 发布时的负载数据
   */
  publish<K extends keyof Topics>(topic: K, payload: Topics[K]): void {
    if (!this.topics[topic]) return;
    this.topics[topic]!.forEach((listener) => listener(payload));
  }
}
export default PubSub;
// // 示例使用
// interface Events {
//   news: { title: string; content: string };
//   weather: { temperature: number; condition: string };
// }

// const pubsub = new PubSub<Events>();

// // 订阅新闻
// const unsubscribeNews = pubsub.subscribe('news', (data) => {
//   console.log('新闻:', data.title, '-', data.content);
// });

// // 订阅天气
// pubsub.subscribe('weather', (data) => {
//   console.log('天气:', data.temperature, '°C,', data.condition);
// });

// // 发布新闻
// pubsub.publish('news', { title: '头条新闻', content: '详细内容...' });

// // 发布天气
// pubsub.publish('weather', { temperature: 25, condition: '晴天' });

// // 取消订阅新闻
// unsubscribeNews();

// // 再次发布新闻（不会被接收）
// pubsub.publish('news', { title: '第二条新闻', content: '更多内容...' });

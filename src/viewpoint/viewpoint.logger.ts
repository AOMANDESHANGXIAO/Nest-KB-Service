import PubSub from 'src/utils/eventEmitter';
import { SqlService } from 'src/db';
import {
  ViewPoint_Logger,
  ViewPoint_Logger_Action,
} from 'src/crud/Table.model';
/**
 * 发布订阅的事件及处理函数定义
 */
interface Event {
  /**
   * 检查观点
   */
  checkViewPoint: {
    service: SqlService;
    checked_viewpoint_id: number;
    student_id: number;
  };
  /**
   * 创建观点
   */
  createViewPoint: {
    service: SqlService;
    viewpoint_id: number;
    student_id: number;
  };
  /**
   * 修改观点
   */
  updateViewPoint: {
    service: SqlService;
    viewpoint_id: number;
    student_id: number;
  };
}
/**
 * TODO: 使用Mysql表存储日志
 */
class ViewpointLogger {
  pubsub: PubSub<Event>;
  constructor() {
    this.pubsub = new PubSub<Event>();
    /**
     * checkViewPoint事件
     */
    this.pubsub.subscribe('checkViewPoint', async (data) => {
      const { service, checked_viewpoint_id, student_id } = data;
      await service.insert(
        service.generateInsertSql<ViewPoint_Logger>(
          'viewpoint_log',
          ['student_id', 'viewpoint_id', 'created_time', 'action'],
          [
            [
              student_id,
              checked_viewpoint_id,
              'NOW',
              ViewPoint_Logger_Action.CHECK,
            ],
          ],
        ),
      );
    });
    /**
     * createViewPoint事件
     */
    this.pubsub.subscribe('createViewPoint', async (data) => {
      const { service, student_id, viewpoint_id } = data;
      await service.insert(
        service.generateInsertSql<ViewPoint_Logger>(
          'viewpoint_log',
          ['student_id', 'viewpoint_id', 'created_time', 'action'],
          [[student_id, viewpoint_id, 'NOW', ViewPoint_Logger_Action.CREATE]],
        ),
      );
    });
    /**
     * updateViewPoint事件
     */
    this.pubsub.subscribe('updateViewPoint', async (data) => {
      const { service, student_id, viewpoint_id } = data;
      await service.insert(
        service.generateInsertSql<ViewPoint_Logger>(
          'viewpoint_log',
          ['student_id', 'viewpoint_id', 'created_time', 'action'],
          [[student_id, viewpoint_id, 'NOW', ViewPoint_Logger_Action.UPDATE]],
        ),
      );
    });
  }
}
export const viewpointLogger = new ViewpointLogger();

/*
 Navicat Premium Data Transfer

 Source Server         : codecat
 Source Server Type    : MySQL
 Source Server Version : 50718
 Source Host           : localhost:3307
 Source Schema         : knowledgebuilding

 Target Server Type    : MySQL
 Target Server Version : 50718
 File Encoding         : 65001

 Date: 28/09/2024 10:38:52
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admin
-- ----------------------------
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin`  (
  `username` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `nickname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_time` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for arguedge
-- ----------------------------
DROP TABLE IF EXISTS `arguedge`;
CREATE TABLE `arguedge`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `source` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `target` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `version` int(255) NOT NULL COMMENT '论证的版本',
  `arguId` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '前端使用的论证的边id',
  `arguKey` int(255) NOT NULL COMMENT '外键，指向node_table的id',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `source_node_pk`(`source`) USING BTREE,
  INDEX `target_node_pk`(`target`) USING BTREE,
  INDEX `arguKey_pk`(`arguKey`) USING BTREE,
  CONSTRAINT `arguKey_pk` FOREIGN KEY (`arguKey`) REFERENCES `node_table` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 118 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for argunode
-- ----------------------------
DROP TABLE IF EXISTS `argunode`;
CREATE TABLE `argunode`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '表的主键',
  `type` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '论证的类型',
  `content` varchar(1000) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '论证的内容',
  `arguKey` int(255) NOT NULL COMMENT '外键，标记来自于哪一个论证',
  `arguId` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '前端使用的论证节点id',
  `version` int(255) NOT NULL COMMENT '标记论证版本',
  `creator` int(255) NULL DEFAULT NULL COMMENT '创建者，student_id。',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `argu_node_pk`(`arguKey`) USING BTREE,
  INDEX `creator_pk`(`creator`) USING BTREE,
  CONSTRAINT `argu_node_pk` FOREIGN KEY (`arguKey`) REFERENCES `node_table` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `creator_pk` FOREIGN KEY (`creator`) REFERENCES `student` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 162 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for class
-- ----------------------------
DROP TABLE IF EXISTS `class`;
CREATE TABLE `class`  (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '班级的id',
  `class_name` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '班级的名称',
  `status` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '班级信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for discuss_action
-- ----------------------------
DROP TABLE IF EXISTS `discuss_action`;
CREATE TABLE `discuss_action`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'discuss操作，feedback或是summary或是close',
  `discuss_id` int(11) NOT NULL COMMENT 'pk，连接discuss表id',
  `created_time` datetime(0) NOT NULL,
  `operator_id` int(11) NOT NULL COMMENT '操作者，连接admin表id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for discussion
-- ----------------------------
DROP TABLE IF EXISTS `discussion`;
CREATE TABLE `discussion`  (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '讨论话题的id',
  `topic_content` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '讨论话题的内容',
  `created_time` datetime(0) NOT NULL COMMENT '创建时间',
  `created_user_id` int(11) NULL DEFAULT NULL COMMENT '创建讨论话题的用户',
  `topic_for_class_id` int(11) NOT NULL COMMENT 'tpoic_for_class_id',
  `status` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `close_time` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `created_user_id`(`created_user_id`) USING BTREE,
  INDEX `topic_for_class_id`(`topic_for_class_id`) USING BTREE,
  CONSTRAINT `discussion_ibfk_2` FOREIGN KEY (`topic_for_class_id`) REFERENCES `class` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '讨论信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for edge_table
-- ----------------------------
DROP TABLE IF EXISTS `edge_table`;
CREATE TABLE `edge_table`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source` int(11) NOT NULL,
  `target` int(11) NOT NULL,
  `topic_id` int(11) NOT NULL,
  `type` varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `source`(`source`) USING BTREE,
  INDEX `target`(`target`) USING BTREE,
  INDEX `edge_table_ibfk_3`(`topic_id`) USING BTREE,
  CONSTRAINT `edge_table_ibfk_1` FOREIGN KEY (`source`) REFERENCES `node_table` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `edge_table_ibfk_2` FOREIGN KEY (`target`) REFERENCES `node_table` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `edge_table_ibfk_3` FOREIGN KEY (`topic_id`) REFERENCES `discussion` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 215 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for group
-- ----------------------------
DROP TABLE IF EXISTS `group`;
CREATE TABLE `group`  (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '团队的id',
  `group_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '团队名称',
  `group_description` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '团队的描述',
  `group_code` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '团队代码',
  `belong_class_id` int(11) NULL DEFAULT NULL,
  `group_color` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_group_class`(`belong_class_id`) USING BTREE,
  CONSTRAINT `fk_group_class` FOREIGN KEY (`belong_class_id`) REFERENCES `class` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 32 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '协作团队信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for node_revise_record_table
-- ----------------------------
DROP TABLE IF EXISTS `node_revise_record_table`;
CREATE TABLE `node_revise_record_table`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `node_id` int(11) NOT NULL,
  `revise_content` varchar(1000) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `created_time` datetime(0) NULL DEFAULT NULL,
  `student_id` int(11) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `node_id`(`node_id`) USING BTREE,
  INDEX `student_id`(`student_id`) USING BTREE,
  CONSTRAINT `node_revise_record_table_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `node_table` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `node_revise_record_table_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 30 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for node_table
-- ----------------------------
DROP TABLE IF EXISTS `node_table`;
CREATE TABLE `node_table`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `content` varchar(1000) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `class_id` int(11) NULL DEFAULT NULL,
  `group_id` int(11) NULL DEFAULT NULL,
  `student_id` int(11) NULL DEFAULT NULL,
  `topic_id` int(11) NULL DEFAULT NULL,
  `created_time` datetime(0) NULL DEFAULT NULL,
  `version` int(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `class_id`(`class_id`) USING BTREE,
  INDEX `group_id`(`group_id`) USING BTREE,
  INDEX `student_id`(`student_id`) USING BTREE,
  INDEX `topic_id`(`topic_id`) USING BTREE,
  CONSTRAINT `node_table_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `node_table_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `node_table_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `node_table_ibfk_4` FOREIGN KEY (`topic_id`) REFERENCES `discussion` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 320 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for node_table_score
-- ----------------------------
DROP TABLE IF EXISTS `node_table_score`;
CREATE TABLE `node_table_score`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recognition` int(255) NOT NULL,
  `understanding` int(255) NOT NULL,
  `evaluation` int(255) NOT NULL,
  `analysis` int(255) NOT NULL,
  `create` int(255) NOT NULL,
  `node_table_id` int(11) NOT NULL,
  `version` int(255) NOT NULL,
  `created_time` datetime(0) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `node_table_pk`(`node_table_id`) USING BTREE,
  CONSTRAINT `node_table_pk` FOREIGN KEY (`node_table_id`) REFERENCES `node_table` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for peer_reference
-- ----------------------------
DROP TABLE IF EXISTS `peer_reference`;
CREATE TABLE `peer_reference`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `from_argu_id` int(11) UNSIGNED NOT NULL COMMENT '标记哪个论点的引用，argunode表',
  `to_argu_id` int(11) NOT NULL COMMENT '标记此观点引用了哪一个论点 node_table表，方便依据id查询引用的论点',
  `created_time` datetime(0) NOT NULL COMMENT '标记引用的创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `pk_1`(`from_argu_id`) USING BTREE,
  INDEX `pk_2`(`to_argu_id`) USING BTREE,
  CONSTRAINT `pk_1` FOREIGN KEY (`from_argu_id`) REFERENCES `arguedge` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `pk_2` FOREIGN KEY (`to_argu_id`) REFERENCES `node_table` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for student
-- ----------------------------
DROP TABLE IF EXISTS `student`;
CREATE TABLE `student`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NULL DEFAULT NULL COMMENT '所属团队的id',
  `class_id` int(11) NOT NULL COMMENT '所属班级的id',
  `username` varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '账号',
  `password` varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '密码',
  `nickname` varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '昵称',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for student_action_log
-- ----------------------------
DROP TABLE IF EXISTS `student_action_log`;
CREATE TABLE `student_action_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `student_id` int(11) NOT NULL,
  `node_id` int(11) NOT NULL,
  `created_time` datetime(0) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `pk_student_id`(`student_id`) USING BTREE,
  INDEX `pk_node_id`(`node_id`) USING BTREE,
  CONSTRAINT `pk_node_id` FOREIGN KEY (`node_id`) REFERENCES `node_table` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `pk_student_id` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 64 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;

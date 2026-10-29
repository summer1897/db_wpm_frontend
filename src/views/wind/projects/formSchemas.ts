import type { FormSchema } from '@/components/core/schema-form/';
import type { WindProjectPayload } from '@/api/backend/api/windProject';

/** 新建项目：编号由管理员定，接入通道（scope）由服务端生成 */
export const projectSchemas: FormSchema<WindProjectPayload>[] = [
  {
    field: 'code',
    component: 'Input',
    label: '项目编号',
    helpMessage: '现场按编号找项目，例如 WN-2026；创建后不可修改',
    colProps: { span: 12 },
    componentProps: { placeholder: '如 WN-2026' },
    rules: [{ required: true, type: 'string', max: 32, message: '请填写项目编号（1-32个字符）' }],
  },
  {
    field: 'name',
    component: 'Input',
    label: '项目名称',
    colProps: { span: 12 },
    componentProps: { placeholder: '如 贵州威宁风电场 50MW' },
    rules: [{ required: true, type: 'string', max: 120, message: '请填写项目名称' }],
  },
  {
    field: 'location',
    component: 'Input',
    label: '所在地',
    colProps: { span: 12 },
    componentProps: { placeholder: '如 贵州省毕节市威宁县' },
  },
  {
    field: 'capacityMw',
    component: 'InputNumber',
    label: '装机容量',
    colProps: { span: 12 },
    componentProps: { min: 0, style: { width: '100%' }, addonAfter: 'MW' },
  },
  {
    field: 'startDate',
    component: 'DatePicker',
    label: '计划开工',
    colProps: { span: 12 },
    componentProps: { valueFormat: 'YYYY-MM-DD', style: { width: '100%' } },
  },
  {
    field: 'endDate',
    component: 'DatePicker',
    label: '计划完工',
    colProps: { span: 12 },
    componentProps: { valueFormat: 'YYYY-MM-DD', style: { width: '100%' } },
  },
  {
    field: 'remark',
    component: 'InputTextArea',
    label: '备注',
    colProps: { span: 24 },
    componentProps: { rows: 2, maxlength: 500, showCount: true, placeholder: '施工范围、业主单位等' },
  },
];

/** 编辑项目：编号与接入通道不允许改，追加状态 */
export const projectEditSchemas: FormSchema<WindProjectPayload>[] = [
  ...projectSchemas,
  {
    field: 'status',
    component: 'Select',
    label: '项目状态',
    colProps: { span: 12 },
    helpMessage: '暂停后 APP 端仍可见该项目，但不能新增风机',
    defaultValue: 'active',
    componentProps: {
      options: [
        { label: '在建', value: 'active' },
        { label: '暂停', value: 'paused' },
        { label: '已完工', value: 'done' },
      ],
    },
  },
];

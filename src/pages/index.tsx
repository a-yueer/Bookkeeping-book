import React, { useEffect, useState } from "react"
import { Table, DatePicker, Button, Modal, Form, Input, Select, Tag } from "antd"
import moment, { Moment } from "moment";
import 'moment/locale/zh-cn';

import { DataConfig, IData } from './DataConfig'
import { formatNumber } from "./utils";
import { CategoryConfig, ICategory, } from "./CategoryConfig";
import { FormComponentProps } from "antd/lib/form";

moment.locale('zh-cn');

const { MonthPicker } = DatePicker;
const { Option } = Select;
const dateFormat = 'YYYY-MM-DD';
const monthFormat = 'YYYY-MM';

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const typeText: { [key: number]: string } = {
  1: "收入",
  0: "支出",
}
interface Props extends FormComponentProps { }



const AccountBook: React.SFC<Props> = ({ form }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableDataConfig, setTableDataConfig] = useState<IData[]>(DataConfig)
  const [showFooter, setShowFooter] = useState<boolean>(false)

  useEffect(() => {
    const data = sessionStorage.getItem("defaultData")
    if (!data) sessionStorage.setItem("defaultData", JSON.stringify(DataConfig))
    setTableDataConfig(data ? JSON.parse(data) : DataConfig)
  }, [])


  const columns = [
    {
      title: '账单时间',
      dataIndex: 'time',
      render: ((text: string) => moment(text).format(dateFormat)),
      align: 'center',
      key: "time",
    },
    {
      title: '账单类型',
      dataIndex: 'type',
      render: ((text: number) => typeText[text]),
      align: 'center',
      key: "type",
    },
    {
      title: '账单分类',
      dataIndex: 'categoryId',
      align: 'center',
      render: ((text: string) => CategoryConfig.find(item => item.id === text)?.name),
      key: "categoryId",
      filters: CategoryConfig.map((item: ICategory) => {
        return { text: item.name, value: item.id };
      }),
      onFilter: (value: any, record: { categoryId: string; }) => record.categoryId === value,
      // sorter: (a: { categoryId: string }, b: { categoryId: string }) => a.categoryId.length - b.categoryId.length,
      sortDirections: ['descend'],
    },
    {
      title: '账单金额',
      dataIndex: 'amount',
      render: ((text: number) => `¥ ${formatNumber(text, 2)}`),
      align: 'center',
      key: "amount",

      sorter: (a: IData, b: IData) => Number(a.amount) - Number(b.amount),
    },
  ];

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true)
    form.validateFieldsAndScroll((err: any, values: IData) => {
      if (!err) {
        tableDataConfig.unshift({
          ...values,
          time: moment(new Date())
        })
        setTableDataConfig(tableDataConfig)
        sessionStorage.setItem("defaultData", JSON.stringify(tableDataConfig))
        setTimeout(() => {
          setVisible(false);
          setLoading(false);
          form.resetFields();
        }, 300)
        return
      }
      setLoading(false)
    });
  }

  const onChange = (date: Moment | null, dateString: string) => {
    const defaultData = sessionStorage.getItem("defaultData");
    if (!date) {
      setTableDataConfig(defaultData ? JSON.parse(defaultData) : tableDataConfig)
      setShowFooter(false)
      return
    }
    setShowFooter(true)
    const selectYear = moment(date)?.year();
    const selectMonth = moment(date)?.month() + 1;
    const data = tableDataConfig?.filter((item: IData) => {
      const valueYear = moment(item.time)?.year();
      const valueMonth = moment(item.time)?.month() + 1;
      if (selectYear === valueYear && selectMonth === valueMonth) {
        return item
      }
      return
    })
    setTableDataConfig(data)
  }
  const renderFooter = () => {
    if (!showFooter) return <div />
    const paySum = tableDataConfig?.filter(i => !Number(i.type)).reduce((acc, cur) => acc + Number(cur.amount), 0)
    const inComeSum = tableDataConfig?.filter(i => Number(i.type)).reduce((acc, cur) => acc + Number(cur.amount), 0)
    return <div>
      当前所选月份：
      支出金额 {`¥${formatNumber(paySum, 2)}`}
      收入金额 {`¥${formatNumber(inComeSum, 2)}`}
    </div>
  }

  return <div style={{ margin: '50px 50px' }}>
    <div style={{ margin: "20px 0" }}>
      <MonthPicker format={monthFormat} placeholder="请选择月份" onChange={onChange} />

      <Button type="primary" style={{ marginLeft: '20px', display: 'inline-block' }} onClick={() => setVisible(!visible)}>新增</Button>
    </div>



    <Table
      columns={columns as any}
      dataSource={tableDataConfig}
      rowKey={(record, index: any) => index}
      bordered
      footer={() => renderFooter()}
    />

    <Modal
      visible={visible}
      title="新增账单"
      onCancel={() => setVisible(false)}
      footer={[
        <Button key="back" onClick={() => setVisible(!visible)}>
          取消
            </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          确定
            </Button>
      ]}
    >
      <Form {...formItemLayout} >
        <Form.Item label="账单类型" >
          {
            form.getFieldDecorator("type", {
              rules: [
                {
                  required: true,
                  message: '必选项!',
                },
              ]
            })(<Select
              placeholder="请选择账单类型"
              allowClear
            >
              {Object.keys(typeText).map((i: any) => <Option value={Number(i)} key={i}>{typeText[i]}</Option>)}

            </Select>)
          }
        </Form.Item>
        <Form.Item label="账单分类" >
          {
            form.getFieldDecorator("categoryId", {})(<Select
              placeholder="请选择账单分类"
              allowClear
            >
              {CategoryConfig.map(item => <Option value={item.id} key={item.id}>{item.name}</Option>)}
            </Select>)
          }
        </Form.Item>
        <Form.Item label="账单金额">
          {form.getFieldDecorator('amount', {
            rules: [
              {
                required: true,
                message: '必填项!',
              },

              {
                max: 100,
                message: '输入长度不大于100',
              },
              {
                validator: (rule: any, value: any, callback: (arg0?: string | undefined) => void) => {
                  if (value) {
                    const n = Number(value);
                    if (n <= 0) {
                      callback('输入项必须大于0');
                      return;
                    }
                  }
                  callback();
                  return;
                },
              },
            ],
          })(<Input prefix="￥" type="number" />)}
        </Form.Item>

      </Form>
    </Modal>
  </div>
}
export default Form.create<Props>()(AccountBook)

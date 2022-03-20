/* 新增待办页面 */

Page({
  // 保存编辑中待办的信息
  data: {
    date: '2022-03-01',
    startTime: '',
    endTime: '',
    title: '',
    desc: '',
    files: [],
    fileName: '',
    freqOptions: ['未完成', '已完成'],
    freq: 0
  },

  onLoad: function(){
    let date = new Date()
    let y = date.getFullYear()
    let m = date.getMonth() + 1 >= 10 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)
    let d = date.getDate() >= 10 ? date.getDate() : '0' + date.getDate()
    let h = date.getHours() >= 10 ? date.getHours() : '0' + date.getHours()
    let mm = date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes()
    let s = date.getSeconds() >= 10 ? date.getSeconds() : '0' + date.getSeconds()
    this.setData({
      date: y + '-' + m + '-' + d,
      startTime: h + ':' + mm,
      createTime: y + '/' + m + '/' + d + ' ' + h + ':' + mm + ':' + s,
    })
    console.log(this.data.time)
  },

  bindTimeChange: function(e) {
    this.setData({
      startTime: e.detail.value
    })
  },

  bindEndTimeChange: function(e) {
    this.setData({
      endTime: e.detail.value
    })
  },

  bindDateChange: function(e) {
    this.setData({
      date: e.detail.value
    })
  },

  // 表单输入处理函数
  onTitleInput(e) {
    this.setData({
      title: e.detail.value
    })
  },

  onDescInput(e) {
    this.setData({
      desc: e.detail.value
    })
  },

  // 上传新附件
  async addFile() {
    // 限制附件个数
    if (this.data.files.length + 1 > getApp().globalData.fileLimit) {
      wx.showToast({
        title: '数量达到上限',
        icon: 'error',
        duration: 2000
      })
      return
    }
    // 从会话选择文件
    wx.chooseMessageFile({
      count: 1
    }).then(res => {
      const file = res.tempFiles[0]
      // 上传文件至云存储
      getApp().uploadFile(file.name,file.path).then(res => {
        // 追加文件记录，保存其文件名、大小和文件 id
        this.data.files.push({
          name: file.name,
          size: (file.size / 1024 / 1024).toFixed(2),
          id: res.fileID
        })
        // 更新文件显示
        this.setData({
          files: this.data.files,
          fileName: this.data.fileName + file.name + ' '
        })
      })
    })
  },

  // 响应事件状态选择器
  onChooseFreq(e) {
    this.setData({
      freq: e.detail.value
    })
  },

  // 保存待办
  async saveTodo() {
    // 对输入框内容进行校验
    if (this.data.title === '') {
      wx.showToast({
        title: '事项标题未填写',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.title.length > 10) {
      wx.showToast({
        title: '事项标题过长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.date == '') {
      wx.showToast({
        title: '请选择日期',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.startTime == '') {
      wx.showToast({
        title: '请选择开始时间',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.endTime == '') {
      wx.showToast({
        title: '请选择结束时间',
        icon: 'error',
        duration: 2000
      })
      return
    }
    if (this.data.desc.length > 100) {
      wx.showToast({
        title: '事项描述过长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    const db = await getApp().database()
    // 在数据库中新建待办事项，并填入已编辑对信息
    db.collection(getApp().globalData.collection).add({
      data: {
        title: this.data.title,       // 待办标题
        date: this.data.date,       // 待办时间
        startTime: this.data.startTime,       // 待办开始时间
        endTime: this.data.endTime,       // 待办结束时间
        createTime: this.data.createTime,       // 待办创建时间
        desc: this.data.desc,         // 待办描述
        files: this.data.files,       // 待办附件列表
        freq: Number(this.data.freq), // 待办完成情况（提醒频率）
        star: false
      }
    }).then(() => {
      wx.navigateBack({
        delta: 0,
      })
    })
  },

  // 重置所有表单项
  resetTodo() {
    this.setData({
      title: '',
      desc: '',
      files: [],
      fileName: '',
      freqOptions: ['未完成', '已完成'],
      freq: 0
    })
  }
})
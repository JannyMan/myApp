/* 待办列表首页 */

Page({
  // 存储请求结果
  data: {
    todos: [], // 用户的所有待办事项
    pending: [], // 未完成待办事项
    finished: [] // 已完成待办事项
  },

  onShow() {
    this.setData({
      timer: setInterval(() => {
        this.getStatus()
      }, 1000)
    })
    // let nowTime = Math.floor(new Date()).getTime()
    // 通过云函数调用获取用户 _openId
    getApp().getOpenId().then(async openid => {
      // 根据 _openId 数据，查询并展示待办列表
      const db = await getApp().database()
      db.collection(getApp().globalData.collection).where({
        _openid: openid
      }).get().then(res => {
        const {
          data
        } = res
        
        data && data.map(v => {
          let {date, startTime, endTime} = v
          if(date){
            v.formatDate = date.replace(/-/g, '/')
            v.startDateTime = date.replace(/-/g, '/') + ' ' + startTime
            v.endDateTime = date.replace(/-/g, '/') + ' ' + endTime
          }
        })
        let pending = data.filter(todo => todo.freq === 0)
        let finished = data.filter(todo => todo.freq === 1)
        pending.map(v => {
          console.log(v)
        })
        // 存储查询到的数据
        this.setData({
          // data 为查询到的所有待办事项列表
          todos: data,
          // 通过 filter 函数，将待办事项分为未完成和已完成两部分
          pending,
          finished
        })
        this.getStatus()
      })
    })
    // 配置首页左划显示的星标和删除按钮
    this.setData({
      slideButtons: [{
        extClass: 'starBtn',
        text: '星标',
        src: '../../images/list/star.png'
      }, {
        type: 'warn',
        text: '删除',
        src: '../../images/list/trash.png'
      }],
    })
  },

  getStatus(){
    let pending = this.data.pending
    pending.forEach(v => {
      let {date, startTime, endTime} = v
      if(date){
        v.formatDate = date.replace(/-/g, '/')
        if(startTime && endTime){
          let nowTime = Math.floor((new Date()).getTime() / 1000)
          let startTimeStmp = Math.floor((new Date(v.formatDate + ' ' + startTime).getTime()) / 1000)
          let endTimeStmp = Math.floor((new Date(v.formatDate + ' ' + endTime).getTime())  / 1000)
          if(nowTime - startTimeStmp < 0){
            // 未开始
            v.status = 1
            let {sy_days, sy_hours,  sy_minutes, sy_seconds} = this.getCountDay(startTimeStmp - nowTime)
            v = Object.assign(v, {sy_days, sy_hours,  sy_minutes, sy_seconds})
          }else if(nowTime - endTimeStmp < 0){
            // 未结束
            v.status = 2
            let {sy_days, sy_hours,  sy_minutes, sy_seconds} = this.getCountDay(endTimeStmp - nowTime)
            v = Object.assign(v, {sy_days, sy_hours,  sy_minutes, sy_seconds})
          }else{
            v.status = 3
          }
        }
      }
    })
    this.setData({
      pending
    })
  },

  getCountDay(time){
    
    //计算出相差天数
    let sy_days = Math.floor(time/(24*3600))
    
    //计算出小时数
    
    let leave1 = time%(24*3600)    //计算天数后剩余的毫秒数
    let sy_hours = Math.floor(leave1/(3600))
    sy_hours = sy_hours >= 10 ? sy_hours : '0' + sy_hours
    //计算相差分钟数
    let leave2 = leave1%(3600)        //计算小时数后剩余的毫秒数
    let sy_minutes = Math.floor(leave2/(60))
    sy_minutes = sy_minutes >= 10 ? sy_minutes : '0' + sy_minutes
    
    
    //计算相差秒数
    let leave3 = leave2%(60)      //计算分钟数后剩余的毫秒数
    let sy_seconds = Math.round(leave3)
    sy_seconds = sy_seconds >= 10 ? sy_seconds : '0' + sy_seconds

    return{sy_days, sy_hours, sy_minutes, sy_seconds}
  },

  // 响应左划按钮事件
  async slideButtonTap(e) {
    // 得到触发事件的待办序号
    const {
      index
    } = e.detail
    // 根据序号获得待办对象
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.pending[todoIndex]
    const db = await getApp().database()
    // 处理星标按钮点击事件
    if (index === 0) {
      // 根据待办的 _id 找到并反转星标标识
      db.collection(getApp().globalData.collection).where({
        _id: todo._id
      }).update({
        data: {
          star: !todo.star
        }
      })
      // 更新本地数据，触发显示更新
      todo.star = !todo.star
      this.setData({
        pending: this.data.pending
      })
    }
    // 处理删除按钮点击事件
    if (index === 1) {
      // 根据待办的 _id 找到并删除待办记录
      db.collection(getApp().globalData.collection).where({
        _id: todo._id
      }).remove()
      // 更新本地数据，快速更新显示
      this.data.pending.splice(todoIndex, 1)
      this.setData({
        pending: this.data.pending
      })
      // 如果删除完所有事项，刷新数据，让页面显示无事项图片
      if (this.data.pending.length === 0 && this.data.finished.length === 0) {
        this.setData({
          todos: [],
          pending: [],
          finished: []
        })
      }
    }
  },

  // 点击左侧单选框时，切换待办状态
  async finishTodo(e) {
    // 根据序号获得触发切换事件的待办
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.pending[todoIndex]
    console.log(todo)
    if(todo && todo.status != 2){
      wx.showToast({
        title: '请在规定时间内完成！',
        icon: "error"
      })
      return
    }
    const db = await getApp().database()
    // 根据待办 _id，获得并更新待办事项状态
    db.collection(getApp().globalData.collection).where({
      _id: todo._id
    }).update({
      // freq == 1 表示待办已完成，不再提醒
      // freq == 0 表示待办未完成，每天提醒
      data: {
        freq: 1
      }
    })
    // 快速刷新数据
    todo.freq = 1
    this.setData({
      pending: this.data.todos.filter(todo => todo.freq === 0),
      finished: this.data.todos.filter(todo => todo.freq === 1)
    })
  },

  // 同上一函数，将待办状态设置为未完成
  async resetTodo(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.finished[todoIndex]
    const db = await getApp().database()
    db.collection(getApp().globalData.collection).where({
      _id: todo._id
    }).update({
      data: {
        freq: 0
      }
    })
    todo.freq = 0
    this.setData({
      pending: this.data.todos.filter(todo => todo.freq === 0),
      finished: this.data.todos.filter(todo => todo.freq === 1)
    })
  },

  // 跳转响应函数
  toFileList(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.pending[todoIndex]
    wx.navigateTo({
      url: '../file/index?id=' + todo._id,
    })
  },

  toDetailPage(e) {
    const todoIndex = e.currentTarget.dataset.index
    const todo = this.data.pending[todoIndex]
    wx.navigateTo({
      url: '../detail/index?id=' + todo._id,
    })
  },

  toAddPage() {
    wx.navigateTo({
      url: '../../pages/add/index',
    })
  }
})
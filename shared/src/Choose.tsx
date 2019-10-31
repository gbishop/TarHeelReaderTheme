import * as React from 'react';
import { observer } from 'mobx-react';
import Store from './Store';
import { observable, action } from 'mobx';
import { THRURL, SharedBookList, LevelNames } from './db';
import { WaitToRender } from './helpers';
import './Choose.css';

@observer
class Choose extends React.Component<{store: Store}, {}> {
  @observable newstudent = '';
  @action updateNewStudent(s: string) {
    this.newstudent = s;
  }
  @observable newgroup = '';
  @action updateNewGroup(s: string) {
    this.newgroup = s;
  }
  @action addStudent(s: string) {
    this.props.store.db.addStudent(s);
    this.props.store.studentid = s;
  }
  render() {
    const store = this.props.store;
    function BookList(sharedBookList: SharedBookList, levelNames: string[], passAll=false) {
      return sharedBookList.length === 0 ? null : (
        <div style={{textAlign: 'center'}}>
          {levelNames.map(level => (
            <div key={level}>
              <button
                className="LevelButton"
                onClick={() => store.bookListToggle(level)}
              >
                {level}
              </button>
              {
                (store.bookListOpen.get(level)) && (
                  <ul className="Find-Results">
                    {sharedBookList
                      .filter(item => item.level === level || passAll)
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map(item => (
                        <li key={item.slug}>
                          <button className="Find-ReadButton" onClick={() => store.setBookid(item.slug)}>
                            <img src={THRURL + item.image} />
                          </button>
                          <h1>
                            {item.status === 'draft' && 'Draft: '}
                            {item.title}
                          </h1>
                          <p className="Find-Author">by {item.author}</p><br/>
                          <p className="Find-Author">comments by: {item.owner}</p><br/>
                          {(item.owner === store.db.login || store.db.isAdmin) &&
                          <button
                            onClick={()=>store.setEditPath(item.slug)}
                            title="Edit"
                            className="EditButton"
                          >&#x270D;</button>}
                        </li>
                      ))
                    }
                  </ul>)
              }
            </div>
          ))}
        </div>
      );
    }
    return (
      <div id="StudentList">
        <h2>Select a student or group</h2>
        <label><b>{store.teacherid}</b> is reading with:&nbsp;
          <select value={store.studentid} onChange={(e) => store.setstudentid(e.target.value)}>
            <option value="">none selected</option>
            {store.db.studentList.map(id => (<option key={id} value={id}>{id}</option>))}
          </select>
        </label><br/>
        <label>Add a student:&nbsp;
          <input
            type="text"
            value={this.newstudent}
            onChange={(e) => this.updateNewStudent(e.target.value)}
            placeholder="Enter student initials"
          />
        </label>
        <button
          onClick={()=>{this.addStudent(this.newstudent); this.updateNewStudent('');}}
        >+</button><br/>
        <label>Add a group:&nbsp;
          <input
            type="text"
            value={this.newgroup}
            onChange={(e) => this.updateNewGroup(e.target.value)}
            placeholder="Enter group name"
          />
        </label>
        <button
          onClick={()=>{this.addStudent('Group: ' + this.newgroup); this.updateNewGroup('')}}
        >+</button><br/>
        {store.db.canWrite &&
        <button
          onClick={()=>store.setEditPath('')}
        >Create a new book</button>}
        {store.db.isAdmin &&
        <button onClick={(e)=>store.db.downloadLog()}>Download Log</button>}
        {!store.studentid ? null : WaitToRender(store.teacherBookListP, (recentBooksList) =>
            <div>
              {BookList(recentBooksList.recent, ['Recent'], true)}
              {BookList(recentBooksList.yours, ['Your Books'], true)}
            </div>
          )
        }
        {!store.studentid ? null : WaitToRender(store.sharedBookListP, 
          sharedBookList => 
            <div>
              {BookList(sharedBookList.books, LevelNames)}
            </div>
          )
        }
      </div>
    );
  }

}

export default Choose;

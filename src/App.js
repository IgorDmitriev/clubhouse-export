import React, { Component } from 'react';
import './App.css';

// material-ui
import { MuiThemeProvider } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import { LinearProgress } from 'material-ui/Progress';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper';
import injectTapEventPlugin from 'react-tap-event-plugin';

import Clubhouse from 'clubhouse-lib';
import flatten from 'flat';
import { CSVLink } from 'react-csv';
import * as Cookies from 'js-cookie';

injectTapEventPlugin();

class App extends Component {
  constructor() {
    super();

    this.state = {
      resource: 'members',
      apiToken: Cookies.get('apiToken'),
      apiTokenSuccess: false,
      data: null,
      loading: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.parseResponseJson = this.parseResponseJson.bind(this);
  }

  componentDidMount() {
    this.initClubhouse();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.resource !== this.state.resource) {
      this.setState({ loading: true });
      this.fetchResourceList();
    }
  }

  initClubhouse() {
    const { apiToken } = this.state;
    this.clubhouse = Clubhouse.create(apiToken);

    this.fetchResourceList()
      .then(() => this.setState({ apiTokenSuccess: true }))
      .then(() => Cookies.set('apiToken', apiToken));
  }

  fetchResourceList() {
    const { resource } = this.state;

    switch (resource) {
      case 'bugs':
        return this.fetchStories('bug');
      case 'features':
        return this.fetchStories('feature');
      default:
        return this.clubhouse.listResource(this.state.resource)
                 .then(this.parseResponseJson);
    }
  }

  fetchStories(type) {
    const params = { story_type: type };
    const URL = this.clubhouse.generateUrl('stories/search');

    return this.clubhouse.requestFactory
            .makeRequest(URL, 'POST', params)
            .then(response =>
              response.json().then(this.parseResponseJson)
            );
  }

  parseResponseJson(json) {
    const data = json.map(obj => flatten(obj, { safe: true }));

    this.setState({ data, loading: false });
  }

  handleChange(value) {
     this.setState({
       resource: value,
    });
  }

  renderInputToken() {
    return (
      <Paper
        style={{
          margin: 20,
          padding: '0 20px',
          width: 380,
          display: 'flex',
          flexDirection: 'column',
          height: 200,
          justifyContent: 'space-around',
        }}
      >
        <TextField
          id="placeholder"
          label="Clubhouse Api token"
          type="text"
          InputProps={{ placeholder: '$api*token%' }}
          helperText="Clubhouse > Settings > API Tokens > Generate Token"
          onChange={(e) => this.setState({ apiToken: e.target.value })}
          marginForm
          autoFocus
        />
        <Button
          raised
          color="primary"
          onClick={() => this.initClubhouse()}
        >
          Save
        </Button>
      </Paper>
    );
  }

  renderNavButtons() {
    return (
      <div style={{ margin: '0 20px' }}>
        <Button color="contrast" onClick={() => this.handleChange('members')}>
          Users
        </Button>
        <Button color="contrast" onClick={() => this.handleChange('epics')}>
          Epics
        </Button>
        <Button color="contrast" onClick={() => this.handleChange('projects')}>
          Projects
        </Button>
        <Button color="contrast" onClick={() => this.handleChange('labels')}>
          Labels
        </Button>
        <Button color="contrast" onClick={() => this.handleChange('features')}>
          Features
        </Button>
        <Button color="contrast" onClick={() => this.handleChange('bugs')}>
          Bugs
        </Button>
      </div>
    );
  }

  renderTable() {
    return (
      <Table style={{tableLayout: 'auto'}}>
        <TableHead>
          {this.renderTableHeaders()}
        </TableHead>
        <TableBody>
          {this.renderTableRows()}
        </TableBody>
      </Table>
    );
  }

  renderTableHeaders() {
    const { data } = this.state;
    const headers = Object.keys(data[0]).map(
      key => <TableCell key={key}>{key}</TableCell>
    );

    return (
      <TableRow>
        {headers}
      </TableRow>
    );
  }

  renderTableRows() {
    const { data } = this.state;
    const headers = Object.keys(data[0]);
    const paginatedData = data.slice(0, 100);

    return (
      paginatedData.map(rowData => (
        <TableRow key={rowData.id}>
          {
            headers.map(key => (
              <TableCell key={key}>
                {JSON.stringify(rowData[key])}
              </TableCell>
            ))
          }
        </TableRow>
      ))
    )
  }

  renderDownloadButton() {
    const { data } = this.state;
    if (!data) return;

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Typography type="title" color="inherit">
          {`${data.length} rows`}
        </Typography>
        <CSVLink
          data={data}
          filename={`${this.state.resource}-${Date.now()}.csv`}
          target="_blank"
        >
          <Button color="contrast">Download</Button>
        </CSVLink>
      </div>
    );
  }

  render() {
    const { data, apiTokenSuccess, loading } = this.state;

    return (
      <MuiThemeProvider>
        <div>
          <AppBar position="static">
            <Toolbar>
              <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
                <Typography type="title" color="inherit">
                  Export Clubhouse Data
                </Typography>
                {apiTokenSuccess && this.renderNavButtons()}
              </div>
              {data && this.renderDownloadButton()}
            </Toolbar>
          </AppBar>
          {loading && <LinearProgress />}
          <section style={{ display: 'flex', justifyContent: 'center' }}>
            {!apiTokenSuccess && this.renderInputToken()}
            {data && this.renderTable()}
          </section>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;

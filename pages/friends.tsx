import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

interface LinkData {
  title: string;
  link: string;
  createdDate: string;
}

const FriendsPage = () => {
  return (
    <Layout variant="home" title="👥 my friends">
      <HeaderImage src="/images/readingthepaper.png" alt="my friends" />

      <div className="box">
<div className="receipt">
    <br/>
  <div className="receipttitle">[友達名鑑]</div>
  <br/>
  Thank you for visiting.
  <br/><br/>
KATIE<br/><br/>

MINGU<br/><br/>

LAUREL<br/><br/>

LINDIE<br/><br/>

VIDAR<br/><br/>

JISU<br/><br/>

<br/>
************************************
<br/>
<br/>
お訪問者様　０００１
<br/><br/><br/>

<img src="/images/barcode.gif" style={{ width: '200px', height: 'auto' }} />

</div>
      </div>
    </Layout>
  );
};

export default FriendsPage;

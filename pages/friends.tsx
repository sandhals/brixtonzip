import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import HeaderImage from '@/components/HeaderImage';

interface LinkData {
  title: string;
  link: string;
  birthday: string; // YYMMDD format
}

const FriendsPage = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [hitCount, setHitCount] = useState('０００１');

  const friends: LinkData[] = [
    {
      title: "KATIE",
      link: "https://katelynsalem.com",
      birthday: "910509"
    },
    {
      title: "GUHONG", 
      link: "https://minguhongmfg.com",
      birthday: "850305"
    },
    {
      title: "LAUREL",
      link: "https://laurelschwulst.com", 
      birthday: "880315"
    },
    {
      title: "LINDIE",
      link: "https://lindiebotes.com",
      birthday: "940804"
    }
  ];

  useEffect(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateString = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    });
    setCurrentTime(`${dateString} ${timeString}`);
  }, []);

  const baseStyle = {
    fontFamily: 'monospace',
    color: '#000',
    fontSize: '14px'
  };

  return (
    <Layout variant="home" title="👥 my friends">
      <HeaderImage src="/images/readingthepaper.png" alt="my friends" />

      <div className="box">
        <div className="receipt" style={{
          ...baseStyle,
          textAlign: 'center',
          padding: '30px 20px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <br/>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            [友達名鑑]
          </div>
          <br/>
          
          <div style={{ ...baseStyle, textAlign: 'left', marginBottom: '5px' }}>
            Thank you for supporting my friends!
          </div>
          <div style={{ ...baseStyle, textAlign: 'left', marginBottom: '20px' }}>
            {currentTime}
          </div>

          {friends.map((friend, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <a 
  href={friend.link}
  target="_blank"
  rel="noopener noreferrer"
  style={{ 
    ...baseStyle,
    textDecoration: 'none',
    fontWeight: 'bold'
  }}
  onMouseOver={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
  onMouseOut={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
>
  {friend.title}
</a>
                <span style={{ ...baseStyle, fontWeight: 'bold' }}>
                  ¥{friend.birthday}
                </span>
              </div>
            </div>
          ))}

          <br/>
          <div style={baseStyle}>
            Total connections: {friends.length}
          </div>
          
          <br/>
          {'*'.repeat(36)}
          <br/><br/>
          
          お訪問者様　001
          <br/><br/><br/>

          <img src="/images/barcode.gif" style={{ width: '200px', height: 'auto' }} />
        </div>
      </div>
    </Layout>
  );
};

export default FriendsPage;
import Header from "./header.jsx";
import Footer from "./footer.jsx";

function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default Layout;

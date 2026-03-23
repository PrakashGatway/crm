import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="signin - admin"
        description="This is React.js"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}

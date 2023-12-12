import React, {useEffect} from "react";
import {CircularProgress, Container, CssBaseline} from "@mui/material";
import Typography from "@mui/material/Typography";
import {paths} from "../../router/paths";
import {useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {clearAuthData, selectToken} from "../../redux/rootslices/auth-data-slice";
import {showSuccessToast} from "../../util/toasts";

export default function SignOut(): React.ReactElement {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const token = useSelector(selectToken)

    useEffect(() => {
        if (token) {
            setTimeout(() => {
                dispatch(clearAuthData())
                showSuccessToast("You have been signed out successfully!")
                navigate(paths.home)
            }, 1000)
        }
    })

    return (
        <Container
            component="main"
            disableGutters
            sx={{
                padding: 0,
                margin: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                minWidth: "100vw",
                flexDirection: "column"
            }}
        >
            <CssBaseline/>
            <Typography
                component="h1"
                variant="h2"
                sx={{
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: {
                        xs: '2rem',
                        sm: '3rem',
                        xl: '5rem',
                    },
                }}
            >
                Logging Out
            </Typography>
            <Typography
                component="h1"
                variant="h4"
                sx={{
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: {
                        xs: '1rem',
                        sm: '1.5rem',
                        xl: '3rem',
                    },
                }}
            >
                Please wait while we sign you out
            </Typography>
            <CircularProgress sx={{
                mt: 2
            }}/>
        </Container>
    )
}